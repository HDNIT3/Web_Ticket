const crypto = require('crypto');
const https = require('https');
const Booking = require('../models/booking');

const VNP_HASHSECRET = process.env.VNP_HASHSECRET || '';

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach(key => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function buildQuery(obj) {
  return Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key]).replace(/%20/g, '+')}`)
    .join('&');
}

function formatVnpDate(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())
  ].join('');
}

function normalizeIp(ip) {
  if (!ip) return '127.0.0.1';
  if (Array.isArray(ip)) ip = ip[0];
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

function makeUniqueRef(bookingId) {
  return `${bookingId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function parseBookingIdFromRef(ref) {
  if (!ref) return null;
  const str = String(ref);
  const idx = str.indexOf('_');
  return idx === -1 ? str : str.slice(0, idx);
}

function buildCallbackPayload({ bookingId, status, email = null, stk = null, tenBank = null, message }) {
  return { bookingId: bookingId || null, status, email, stk, tenBank, message };
}

async function autoCancelBooking(bookingId) {
  if (!bookingId) return;
  try {
    const Booking = require('../models/booking');
    const Ticket = require('../models/ticket');
    const Promotion = require('../models/promotion');

    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === 'PENDING') {
      booking.status = 'CANCELLED';
      await booking.save();

      await Ticket.updateMany({ booking: bookingId }, { status: 'CANCELLED' });

      // Restore promotion quantity if used
      const firstTicket = await Ticket.findOne({ booking: bookingId });
      if (firstTicket && firstTicket.promotion?.promotionId) {
        await Promotion.findByIdAndUpdate(firstTicket.promotion.promotionId, { $inc: { quantity: 1 } });
      }
      console.log(`[AutoCancel] Successfully auto cancelled booking ${bookingId} on failed/cancelled payment callback.`);
    }
  } catch (err) {
    console.error(`[AutoCancel] Error auto cancelling booking ${bookingId}:`, err);
  }
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);

    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      res => {
        let raw = '';
        res.on('data', chunk => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch (e) {
            reject(new Error('Không parse được response từ MOMO'));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const PaymentService = {
  createPaymentUrl: async (req) => {
    const { bookingId, method } = req.body || {};
    if (!bookingId) throw Object.assign(new Error('Thiếu bookingId'), { statusCode: 400 });
    if (!method) throw Object.assign(new Error('Thiếu phương thức thanh toán (momo hoặc vnpay)'), { statusCode: 400 });

    const normalized = String(method).toLowerCase();
    if (!['momo', 'vnpay'].includes(normalized)) {
      throw Object.assign(new Error('Phương thức không hợp lệ, chỉ hỗ trợ momo hoặc vnpay'), { statusCode: 400 });
    }

    // Read-only: only lấy totalAmount từ booking để tạo URL
    const booking = await Booking.findById(bookingId).select('_id totalAmount').lean();
    if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { statusCode: 404 });

    const amount = Number(booking.totalAmount || 0);
    if (amount <= 0) throw Object.assign(new Error('Booking không có số tiền để thanh toán'), { statusCode: 400 });

    if (normalized === 'momo') {
      const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
      const partnerCode = process.env.MOMO_PARTNER_CODE || '';
      const accessKey = process.env.MOMO_ACCESS_KEY || '';
      const secretKey = process.env.MOMO_SECRET_KEY || '';
      const orderId = makeUniqueRef(String(booking._id));
      const requestId = makeUniqueRef(String(booking._id));
      const orderInfo = `Thanh toan booking ${booking._id}`;
      const redirectUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3000/api/payment/momo/callback';
      const ipnUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/api/payment/momo/ipn';
      // Force bank-account/ATM flow (not wallet QR)
      const requestType = process.env.MOMO_REQUEST_TYPE || 'payWithATM';
      const extraData = `bookingId=${booking._id}`;

      const rawSignature =
        `accessKey=${accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&ipnUrl=${ipnUrl}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&partnerCode=${partnerCode}` +
        `&redirectUrl=${redirectUrl}` +
        `&requestId=${requestId}` +
        `&requestType=${requestType}`;

      const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

      const momoReqBody = {
        partnerCode,
        accessKey,
        requestId,
        amount: String(amount),
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'vi'
      };

      const momoRes = await postJson(endpoint, momoReqBody);
      if (Number(momoRes.resultCode) !== 0 || !momoRes.payUrl) {
        throw Object.assign(new Error(momoRes.message || 'Tạo URL MOMO thất bại'), { statusCode: 400 });
      }

      return {
        url: momoRes.payUrl,
        ...buildCallbackPayload({
          bookingId: String(booking._id),
          status: 'PENDING',
          email: null,
          stk: null,
          tenBank: 'MOMO',
          message: 'Tạo URL thanh toán MOMO thành công'
        })
      };
    }

    const base = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const tmnCode = process.env.VNP_TMNCODE || '';
    const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay/callback';
    const txnRef = makeUniqueRef(String(booking._id));
    const ipAddr = normalizeIp(req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress);
    const createDate = formatVnpDate(new Date());

    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      // Force Internet Banking / ATM flow instead of QR flow
      vnp_BankCode: process.env.VNP_BANK_CODE || 'VNBANK',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan booking ${booking._id}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(amount * 100)),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    const sorted = sortObject(vnpParams);
    const signData = buildQuery(sorted);
    const secureHash = crypto.createHmac('sha512', VNP_HASHSECRET).update(signData).digest('hex');
    const payUrl = `${base}?${signData}&vnp_SecureHash=${secureHash}`;

    return {
      url: payUrl,
      ...buildCallbackPayload({
        bookingId: String(booking._id),
        status: 'PENDING',
        email: null,
        stk: null,
        tenBank: null,
        message: 'Tạo URL thanh toán VNPAY thành công'
      })
    };
  },

  handleVnpayCallback: async (req) => {
    const params = Object.assign({}, req.query || {}, req.body || {});
    const bookingId = params.bookingId || parseBookingIdFromRef(params.vnp_TxnRef) || null;
    const responseCode = params.vnp_ResponseCode || '';
    const email = params.email || params.vnp_Bill_Email || params.vnp_Customer_Email || null;
    const stk = params.stk || params.number || params.vnp_BankTranNo || params.vnp_TransactionNo || null;
    const tenBank = params.vnp_BankCode || params.tenBank || null;

    // Optional signature validation (no DB write)
    if (VNP_HASHSECRET && params.vnp_SecureHash) {
      const raw = {};
      Object.keys(params).forEach(key => {
        if (!key.startsWith('vnp_')) return;
        if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') return;
        raw[key] = params[key];
      });
      const signData = buildQuery(sortObject(raw));

      const computedHash = crypto.createHmac('sha512', VNP_HASHSECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');
      if (computedHash !== String(params.vnp_SecureHash).toLowerCase()) {
        return buildCallbackPayload({
          bookingId,
          status: 'FAILED',
          email,
          stk,
          tenBank,
          message: 'Chữ ký VNPAY không hợp lệ'
        });
      }
    }

    if (responseCode === '00') {
      return buildCallbackPayload({
        bookingId,
        status: 'PAID',
        email,
        stk,
        tenBank,
        message: 'Thanh toán thành công'
      });
    }

    if (responseCode === '24') {
      if (bookingId) {
        await autoCancelBooking(bookingId);
      }
      return buildCallbackPayload({
        bookingId,
        status: 'CANCELLED',
        email,
        stk,
        tenBank,
        message: 'Khách hàng hủy giao dịch'
      });
    }

    if (bookingId) {
      await autoCancelBooking(bookingId);
    }

    return buildCallbackPayload({
      bookingId,
      status: 'FAILED',
      email,
      stk,
      tenBank,
      message: `Thanh toán thất bại, code=${responseCode || 'UNKNOWN'}`
    });
  },

  handleMomoIpn: async (req) => {
    const body = req.body || {};
    const bookingId = body.bookingId || parseBookingIdFromRef(body.orderId) || null;
    const resultCode = Number(body.resultCode);
    const email = body.email || body.customerEmail || body.payerEmail || null;
    const stk = body.stk || body.number || body.accountNumber || body.phone || body.senderPhone || null;
    const tenBank = body.tenBank || body.bankName || 'MOMO';

    if (resultCode === 0) {
      return buildCallbackPayload({ bookingId, status: 'PAID', email, stk, tenBank, message: 'Thanh toán thành công' });
    }

    if (resultCode === 49 || resultCode === 9000) {
      if (bookingId) {
        await autoCancelBooking(bookingId);
      }
      return buildCallbackPayload({ bookingId, status: 'CANCELLED', email, stk, tenBank, message: 'Khách hàng hủy giao dịch' });
    }

    if (bookingId) {
      await autoCancelBooking(bookingId);
    }

    return buildCallbackPayload({
      bookingId,
      status: 'FAILED',
      email,
      stk,
      tenBank,
      message: `Thanh toán thất bại, resultCode=${Number.isNaN(resultCode) ? 'UNKNOWN' : resultCode}`
    });
  },

  handleMomoReturn: async (req) => {
    const params = Object.assign({}, req.query || {}, req.body || {});
    const bookingId = params.bookingId || parseBookingIdFromRef(params.orderId) || null;
    const resultCode = Number(params.resultCode);
    const email = params.email || params.customerEmail || params.payerEmail || null;
    const stk = params.stk || params.number || params.accountNumber || params.phone || params.senderPhone || null;
    const tenBank = params.tenBank || params.bankName || 'MOMO';

    if (resultCode === 0) {
      return buildCallbackPayload({ bookingId, status: 'PAID', email, stk, tenBank, message: 'Thanh toán thành công' });
    }

    if (resultCode === 49 || resultCode === 9000) {
      if (bookingId) {
        await autoCancelBooking(bookingId);
      }
      return buildCallbackPayload({ bookingId, status: 'CANCELLED', email, stk, tenBank, message: 'Khách hàng hủy giao dịch' });
    }

    if (bookingId) {
      await autoCancelBooking(bookingId);
    }

    return buildCallbackPayload({
      bookingId,
      status: 'FAILED',
      email,
      stk,
      tenBank,
      message: `Thanh toán thất bại, resultCode=${Number.isNaN(resultCode) ? 'UNKNOWN' : resultCode}`
    });
  }
};

module.exports = PaymentService;
