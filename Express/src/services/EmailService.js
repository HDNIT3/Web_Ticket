const sendEmail = require('../config/mailer');

const EmailService = {
  sendRegisterOtp: async (toEmail, otp) => {
    const subject = '[Movie App] Mã OTP kích hoạt tài khoản';

    const text =
      `Xin chào!\n\n` +
      `Mã OTP kích hoạt tài khoản của bạn là: ${otp}\n` +
      `Mã có hiệu lực trong 5 phút.\n\n` +
      `Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.\n\n` +
      `Trân trọng,\nMovie App Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                    border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #1a1a2e; padding: 24px; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 24px;">🎬 Movie App</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #333; margin-top: 0;">Kích hoạt tài khoản</h2>
            <p style="color: #555; line-height: 1.6;">
              Xin chào! Đây là mã OTP để xác minh địa chỉ email và kích hoạt tài khoản của bạn:
            </p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
                ${otp}
              </span>
            </div>
            <p style="color: #888; font-size: 13px;">
              ⏱ Mã có hiệu lực trong <strong>5 phút</strong>.
            </p>
            <p style="color: #888; font-size: 13px;">
              Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
            </p>
          </div>
          <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #aaa;">
            © 2025 Movie App Team — Group 09
          </div>
        </div>`;

    await sendEmail(toEmail, subject, text, html);
  },
  sendResetOtp: async (toEmail, otp) => {
    const subject = '[Movie App] Mã OTP đặt lại mật khẩu';
    const text =
      `Xin chào!\n\n` +
      `Mã OTP đặt lại mật khẩu của bạn là: ${otp}\n` +
      `Mã có hiệu lực trong 5 phút.\n\n` +
      `Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.\n\n` +
      `Trân trọng,\nMovie App Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #e94560; margin: 0; font-size: 24px;">🎬 Movie App</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #333; margin-top: 0;">Đặt lại mật khẩu</h2>
          <p style="color: #555; line-height: 1.6;">
            Xin chào! Đây là mã OTP để đặt lại mật khẩu của bạn:
          </p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
              ${otp}
            </span>
          </div>
          <p style="color: #888; font-size: 13px;">
            ⏱ Mã có hiệu lực trong <strong>5 phút</strong>.
          </p>
          <p style="color: #888; font-size: 13px;">
            Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
          </p>
        </div>
        <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #aaa;">
          © 2025 Movie App Team — Group 09
        </div>
      </div>`;
    await sendEmail(toEmail, subject, text, html);
  },

  sendBookingInvoiceEmail: async (toEmail, booking) => {
    try {
      const subject = `[CinemaHCMUTE] Xác nhận đặt vé thành công - Đơn hàng #${booking._id.toString().slice(-6).toUpperCase()}`;

      const showtime = booking.showtime || {};
      const movie = showtime.movie || {};
      const auditorium = showtime.auditorium || {};
      const payment = booking.payment || {};
      const tickets = booking.tickets || [];
      const extras = booking.bookingExtras || [];

      const formatCurrency = (val) => {
        if (!val && val !== 0) return '0đ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
      };

      const formatDate = (val) => {
        if (!val) return 'Đang cập nhật';
        return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(val));
      };

      const formatTime = (val) => {
        if (!val) return 'Đang cập nhật';
        return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(val));
      };

      // Compile extras list
      let extrasHtml = '';
      if (extras.length > 0) {
        extrasHtml = extras.map(e => `
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 12px 0; color: #475569;">${e.service?.name || 'Dịch vụ'} (x${e.quantity})</td>
            <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">${formatCurrency(e.totalPrice)}</td>
          </tr>
        `).join('');
      } else {
        extrasHtml = `<tr><td colspan="2" style="padding: 12px 0; color: #94a3b8; font-style: italic; text-align: center;">Không có dịch vụ đi kèm</td></tr>`;
      }

      // Compile tickets listing for the billing
      const ticketsSummaryHtml = tickets.map(t => `
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 12px 0; color: #475569;">Ghế ${t.seat?.name || 'K xác định'} (${t.seat?.seatType?.name || 'Thường'})</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">${formatCurrency(t.finalPrice)}</td>
        </tr>
      `).join('');

      // Compile actual ticket cards with independent QR codes so they can be split/shared!
      const ticketCardsHtml = tickets.map((t, idx) => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${t._id.toString()}`;
        return `
          <div style="background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: left;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
                  <span style="font-size: 18px; font-weight: 800; color: #dc2626; letter-spacing: 0.5px;">VÉ XEM PHIM #${idx + 1}</span>
                </td>
                <td style="border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: right;">
                  <span style="background: #e0e7ff; color: #4f46e5; font-size: 11px; font-weight: 800; padding: 6px 12px; border-radius: 9999px; text-transform: uppercase;">
                    ${t.seat?.seatType?.name || 'STANDARD'}
                  </span>
                </td>
              </tr>
            </table>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="width: 60%; vertical-align: top; padding-right: 12px;">
                  <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.3;">${movie.title || 'Phim xem rạp'}</h4>
                  <p style="margin: 0 0 6px 0; color: #475569; font-size: 13px;">📅 Ngày: <strong style="color: #0f172a;">${formatDate(showtime.startTime)}</strong></p>
                  <p style="margin: 0 0 6px 0; color: #475569; font-size: 13px;">⏰ Suất chiếu: <strong style="color: #ef4444; font-size: 14px;">${formatTime(showtime.startTime)}</strong></p>
                  <p style="margin: 0 0 6px 0; color: #475569; font-size: 13px;">🎬 Phòng chiếu: <strong style="color: #0f172a;">${auditorium.name || 'Phòng chiếu'}</strong></p>
                  <p style="margin: 8px 0 0 0; color: #10b981; font-size: 16px; font-weight: 700;">💺 SỐ GHẾ: <strong style="font-size: 22px; color: #10b981;">${t.seat?.name || 'N/A'}</strong></p>
                  <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 11px; font-family: monospace;">Mã vé: ${t._id.toString()}</p>
                </td>
                <td style="width: 40%; text-align: center; vertical-align: middle;">
                  <div style="display: inline-block; padding: 8px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                    <img src="${qrUrl}" alt="Ticket QR Code" style="width: 140px; height: 140px; display: block;" />
                  </div>
                  <span style="display: block; font-size: 10px; color: #64748b; margin-top: 8px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">MÃ QUÉT TẠI QUẦY</span>
                </td>
              </tr>
            </table>
            
            <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-style: italic;">
                Bạn có thể lưu ảnh vé này để chia sẻ cho người đi cùng quét trực tiếp vào phòng chiếu!
              </p>
            </div>
          </div>
        `;
      }).join('');

      const text = `Xin chào! Bạn đã đặt vé thành công đơn hàng ${booking._id.toString()}. Vui lòng xem hóa đơn chi tiết trong email HTML.`;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 16px; color: #334155; line-height: 1.5; text-align: left;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
            
            <!-- Banner Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 40px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 1px; font-weight: 950; text-transform: uppercase;">🎥 CinemaHCMUTE</h1>
              <p style="color: #93c5fd; margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!</p>
            </div>
            
            <!-- Success Alert -->
            <div style="background: #d1fae5; padding: 18px; border-left: 6px solid #10b981; text-align: center; font-weight: 800; color: #065f46; font-size: 16px; letter-spacing: 0.5px;">
              🎉 ĐẶT VÉ VÀ THANH TOÁN THÀNH CÔNG!
            </div>
            
            <div style="padding: 36px 30px;">
              <p style="font-size: 17px; color: #0f172a; margin-top: 0;">
                Xin chào <strong>${booking.user?.name || 'Khách hàng'}</strong>,
              </p>
              <p style="font-size: 14.5px; color: #475569; margin-bottom: 28px;">
                Đơn đặt vé <strong>#${booking._id.toString().toUpperCase()}</strong> đã thanh toán hoàn tất. Dưới đây là chi tiết hóa đơn thanh toán và các vé xem phim của bạn:
              </p>
              
              <!-- Showtime Info Panel -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px; font-weight: 800; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 16px; letter-spacing: 0.5px;">🎬 THÔNG TIN SUẤT CHIẾU</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14.5px;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Phim:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 16px;">${movie.title || 'Phim'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phòng chiếu:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${auditorium.name || 'Phòng chiếu'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Ngày chiếu:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${formatDate(showtime.startTime)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Suất chiếu:</td>
                    <td style="padding: 8px 0; color: #ef4444; font-weight: 800; font-size: 18px;">${formatTime(showtime.startTime)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Billing Details -->
              <h3 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; letter-spacing: 0.5px;">💵 CHI TIẾT HÓA ĐƠN</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 32px;">
                <thead>
                  <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-weight: bold;">
                    <th style="padding-bottom: 10px; color: #475569;">Mục chọn đặt</th>
                    <th style="padding-bottom: 10px; text-align: right; color: #475569;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketsSummaryHtml}
                  ${extrasHtml}
                  
                  <!-- Financial totals -->
                  <tr style="border-top: 2px solid #cbd5e1;">
                    <td style="padding: 16px 0 8px 0; font-size: 14.5px; font-weight: bold; color: #475569;">Tổng tiền gốc:</td>
                    <td style="padding: 16px 0 8px 0; text-align: right; font-size: 14.5px; font-weight: bold; color: #475569;">
                      ${formatCurrency(booking.totalAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Phương thức:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e3a8a;">${payment.paymentMethod || 'VNPAY'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0 16px 0; font-size: 17px; font-weight: 900; color: #0f172a;">TỔNG THANH TOÁN:</td>
                    <td style="padding: 8px 0 16px 0; text-align: right; font-size: 20px; font-weight: 900; color: #f59e0b;">
                      ${formatCurrency(booking.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Separation Line -->
              <div style="margin: 40px 0; border-top: 2px dashed #cbd5e1;"></div>
              
              <!-- Dynamic tickets list -->
              <h3 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 12px; text-align: center; letter-spacing: 0.5px; text-transform: uppercase;">🎟️ DANH SÁCH VÉ & MÃ QUÉT QR</h3>
              <p style="font-size: 13.5px; color: #64748b; margin-top: 0; margin-bottom: 32px; text-align: center; line-height: 1.5; padding: 0 10px;">
                Mỗi chiếc ghế dưới đây tương ứng với 1 chiếc vé độc lập có mã QR riêng biệt. Bạn có thể chia sẻ từng mã này cho bạn bè hoặc người thân đi cùng quét trực tiếp tại cửa soát vé.
              </p>
              
              ${ticketCardsHtml}
              
            </div>
            
            <!-- Footer Branding -->
            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: bold; color: #475569;">🎬 CinemaHCMUTE — Nhóm 09</p>
              <p style="margin: 0 0 18px 0; font-weight: 500;">Trường Đại học Sư phạm Kỹ thuật TP.HCM</p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">Đây là email tự động từ hệ thống đặt vé CinemaHCMUTE. Vui lòng không trả lời trực tiếp email này.</p>
            </div>
          </div>
        </div>
      `;

      await sendEmail(toEmail, subject, text, html);
    } catch (err) {
      console.error('Error compiling or sending booking email:', err);
    }
  },

  sendNewMovieNotification: async (toEmail, movie) => {
    try {
      const subject = `[CinemaHCMUTE] 🎬 Phim mới ra lò: "${movie.title}"`;
      const text = `Phim mới "${movie.title}" đã được thêm vào rạp! Xem chi tiết và lịch chiếu ngay.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #1a1a2e; padding: 24px; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 24px;">🎬 CinemaHCMUTE</h1>
          </div>
          <div style="padding: 24px; text-align: center;">
            <img src="${movie.image || 'https://via.placeholder.com/300x450'}" alt="${movie.title}" style="max-width: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 16px;" />
            <h2 style="color: #1a1a2e; margin: 0 0 10px 0;">${movie.title}</h2>
            <p style="color: #555; font-size: 14px; line-height: 1.6; text-align: left;">
              Chào bạn! Một bộ phim bom tấn mới vừa được khởi chiếu tại rạp. Xem chi tiết thông tin phim bên dưới:
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: left; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 13px;"><strong>Thời lượng:</strong> ${movie.duration || 'Đang cập nhật'} phút</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Thể loại:</strong> ${movie.genres?.map(g => g.name).join(', ') || 'Đang cập nhật'}</p>
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/movie/${movie._id}" style="display: inline-block; background: #e94560; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Đặt vé ngay 🎟️</a>
          </div>
          <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #aaa;">
            © 2026 CinemaHCMUTE Team
          </div>
        </div>`;
      await sendEmail(toEmail, subject, text, html);
    } catch (err) {
      console.error('Error sending new movie email:', err);
    }
  },

  sendNewShowtimeNotification: async (toEmail, movie, showtime) => {
    try {
      const subject = `[CinemaHCMUTE] 🔥 Lịch chiếu mới cho phim yêu thích: "${movie.title}"`;
      const formatTime = (val) => {
        if (!val) return 'Đang cập nhật';
        return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(val));
      };
      
      const text = `Phim yêu thích "${movie.title}" của bạn vừa có lịch chiếu mới vào lúc ${formatTime(showtime.startTime)}. Đặt vé ngay!`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #1a1a2e; padding: 24px; text-align: center;">
            <h1 style="color: #e94560; margin: 0; font-size: 24px;">🎬 CinemaHCMUTE</h1>
          </div>
          <div style="padding: 24px;">
            <h3 style="color: #1a1a2e; margin-top: 0;">Lịch chiếu mới cho phim yêu thích!</h3>
            <p style="color: #555; font-size: 14px; line-height: 1.5;">
              Chào bạn, bộ phim nằm trong danh sách yêu thích của bạn <strong>"${movie.title}"</strong> đã được lên lịch chiếu mới:
            </p>
            <div style="background: #eef2ff; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 15px; color: #1e1b4b;"><strong>⏰ Thời gian:</strong> <span style="color: #ef4444; font-weight: bold;">${formatTime(showtime.startTime)}</span></p>
              <p style="margin: 0; font-size: 14px; color: #1e1b4b;"><strong>🏛️ Phòng chiếu:</strong> ${showtime.auditorium?.name || 'Đang cập nhật'}</p>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/booking/${showtime._id}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Đặt vé ngay 🎫</a>
            </div>
          </div>
          <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #aaa;">
            © 2026 CinemaHCMUTE Team
          </div>
        </div>`;
      await sendEmail(toEmail, subject, text, html);
    } catch (err) {
      console.error('Error sending new showtime email:', err);
    }
  }
};
module.exports = EmailService;