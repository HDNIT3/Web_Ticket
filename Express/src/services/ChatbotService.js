const https = require('https');
const Movie = require('../models/movie');
const Showtime = require('../models/showtime');
const Promotion = require('../models/promotion');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `Bạn là trợ lý AI của rạp chiếu phim Movie Group 9. Nhiệm vụ của bạn là:
1. Tư vấn phim đang chiếu và sắp chiếu
2. Cung cấp thông tin suất chiếu, lịch chiếu
3. Hướng dẫn đặt vé trực tuyến
4. Giới thiệu các chương trình khuyến mãi và thực đơn bắp nước (dịch vụ)
5. Giải đáp thắc mắc về chính sách rạp

THÔNG TIN CỐ ĐỊNH VỀ RẠP MOVIE GROUP 9:
- Tên rạp đầy đủ: CinemaHCMUTE - Rạp chiếu phim Movie Group 9.
- Địa chỉ: Số 01 Võ Văn Ngân, phường Linh Chiểu, thành phố Thủ Đức, TP. Hồ Chí Minh (nằm tại khuôn viên Đại học Sư phạm Kỹ thuật TP.HCM).
- Hotline hỗ trợ trực tiếp: 1900 1234.
- Email liên hệ: support@cinemahcmute.vn.
- Giờ mở cửa hoạt động: Từ 08:00 đến 23:30 tất cả các ngày trong tuần (kể cả các ngày Lễ, Tết).
- Cơ sở vật chất phòng chiếu (Auditorium):
  + Trang bị các phòng chiếu hiện đại (P1, P2, P3...) với hệ thống âm thanh vòm Dolby Atmos chuẩn Hollywood và màn chiếu độ nét cao.
  + Các loại ghế ngồi trong phòng chiếu:
    * Ghế Thường (Standard): Giá vé cơ bản, vị trí hai bên và hàng đầu.
    * Ghế VIP: Vị trí trung tâm góc nhìn tốt nhất, ngồi êm ái hơn, giá phụ thu nhẹ (+15k-20k).
    * Ghế Đôi (Couple / Sweetbox): Vị trí ở hàng cuối cùng, không vách ngăn giữa để tạo sự riêng tư cho các cặp đôi.
- Chính sách vé & Đổi trả:
  + Đổi suất chiếu hoặc đổi vé: Được phép đổi trước thời điểm phim chiếu ít nhất 2 giờ (cần thực hiện trực tiếp tại quầy hoặc gọi hotline).
  + Hủy vé & Hoàn tiền: Được phép hủy và nhận hoàn tiền 70% giá trị vé nếu hủy trước giờ chiếu ít nhất 24 giờ. Tiền hoàn sẽ được cộng dưới dạng điểm tích lũy hoặc gửi trực tiếp tùy hình thức thanh toán.
- Phương thức thanh toán trực tuyến: Hỗ trợ thanh toán an toàn, bảo mật thông qua Cổng thanh toán VNPay (Thẻ ATM, Ngân hàng nội địa) và Ví điện tử MoMo.
- Chương trình thành viên (Loyalty Member): Khách hàng đăng ký tài khoản có thể tích lũy điểm khi mua vé để dùng điểm đó mua vé hoặc đổi các phần quà bắp nước miễn phí tại quầy.

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
- Sử dụng dữ liệu thực được cung cấp khi trả lời.
- Khi người dùng muốn đặt vé hoặc xem chi tiết một bộ phim cụ thể, hướng dẫn họ và bạn có thể cung cấp đường dẫn trực tiếp hoặc nút hành động.
- Giới hạn câu trả lời trong phạm vi rạp chiếu phim. Nếu người dùng hỏi các câu hỏi không liên quan đến phim ảnh hoặc rạp chiếu phim, hãy khéo léo từ chối hỗ trợ.
- Nếu không biết thông tin cụ thể (ví dụ suất chiếu ngày mai chưa có trong hệ thống), hãy thành thật nói không biết và gợi ý họ liên hệ hotline hoặc nhân viên tại rạp.
- Phản hồi ngắn gọn, súc tích, dễ đọc (dùng emoji phù hợp).
- KHÔNG bịa đặt thông tin phim hoặc suất chiếu không có trong dữ liệu.
- Nếu có thông tin người dùng đăng nhập (ở phần dữ liệu hệ thống), hãy cá nhân hóa lời chào bằng cách gọi tên họ (ví dụ: Chào anh Nguyễn!).
- Bạn có thể trả lời các câu hỏi về điểm tích lũy, phim yêu thích, hoặc danh sách vé đã mua của người dùng đăng nhập dựa trên dữ liệu thực tế được cung cấp. Tuyệt đối không tự bịa đặt thông tin.
- Khi giới thiệu vé đã mua gần đây, bạn có thể gợi ý họ nhấn nút chuyển hướng đến trang quản lý vé: /my-tickets.

Khi trả lời, nếu phù hợp hãy thêm đúng 1 dòng ở CUỐI response theo định dạng:
[ACTIONS: {"type":"navigate","label":"Tên nút","path":"/đường-dẫn"}]
- Path hợp lệ: 
  + /movies (Trang danh sách tất cả phim)
  + /promotions (Trang khuyến mãi)
  + /my-tickets (Trang vé của tôi)
  + /services (Trang dịch vụ, thực đơn bắp nước và combo)
  + /movie/<MOVIE_ID> (Trang chi tiết phim cụ thể, thay <MOVIE_ID> bằng ID Phim thực tế trong dữ liệu được cấp, ví dụ: /movie/64b7f9a888c...)
  + /booking/<SHOWTIME_ID> (Trang đặt vé cho suất chiếu cụ thể, thay <SHOWTIME_ID> bằng ID suất chiếu thực tế trong dữ liệu được cấp, ví dụ: /booking/64b7f9a8...)
- Nếu người dùng muốn xem thông tin chi tiết của một bộ phim cụ thể mà bạn tìm thấy trong dữ liệu, hãy CHẮC CHẮN thêm nút hành động chuyển hướng đến phim đó bằng path /movie/<MOVIE_ID>.
- Bạn cũng có thể chèn link trong văn bản dạng markdown: [Tên Phim](/movie/<MOVIE_ID>).
Chỉ thêm [ACTIONS: ...] khi thực sự cần thiết.`;

function doGeminiRequest(systemInstruction, contents, modelName) {
    return new Promise((resolve, reject) => {
        const requestBody = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        };
        const body = JSON.stringify(requestBody);
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const url = new URL(apiUrl);

        const req = https.request(
            {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) {
                            console.error(`[Gemini - ${modelName}] Error:`, parsed.error.status, parsed.error.message?.substring(0, 100));
                            return reject(new Error(parsed.error.status || 'GEMINI_ERROR'));
                        }
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (!text) return reject(new Error('EMPTY_RESPONSE'));
                        resolve(text);
                    } catch (e) {
                        reject(new Error('PARSE_ERROR'));
                    }
                });
            }
        );
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function callGeminiAPI(systemInstruction, contents) {
    const candidateModels = [
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash'
    ];
    
    let lastError = null;
    
    for (const model of candidateModels) {
        try {
            return await doGeminiRequest(systemInstruction, contents, model);
        } catch (err) {
            lastError = err;
            if (err.message === 'PERMISSION_DENIED' || err.message === 'API_KEY_INVALID') {
                throw err;
            }
            console.log(`[ChatbotService] Model ${model} gặp sự cố (${err.message}). Đang thử model tiếp theo...`);
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }
    }
    
    throw lastError || new Error('ALL_MODELS_FAILED');
}

function detectIntent(message) {
    const lower = message.toLowerCase();
    const intents = [];

    if (/phim|movie|film|chiếu|xem|đang chiếu|sắp chiếu/.test(lower)) intents.push('movies');
    if (/suất|lịch|giờ|thời gian|khi nào|showtime/.test(lower)) intents.push('showtimes');
    if (/khuyến mãi|ưu đãi|giảm giá|voucher|promotion|coupon|mã giảm/.test(lower)) intents.push('promotions');
    if (/đặt vé|mua vé|book|ticket/.test(lower)) intents.push('booking');
    if (/giá vé|bao nhiêu tiền|giá bao|vé bao nhiêu/.test(lower)) intents.push('price');
    if (/hủy vé|đổi vé|hoàn tiền|refund|chính sách/.test(lower)) intents.push('policy');
    if (/dịch vụ|bắp|nước|popcorn|bỏng|ăn|uống|combo|service/.test(lower)) intents.push('services');

    if (intents.length === 0 && /\b(chào|hello|hi|hey)\b|xin chào/.test(lower)) {
        intents.push('greeting');
    }

    return intents.length > 0 ? intents : ['general'];
}

async function fetchContextData(intents, message) {
    const context = {};
    try {
        if (intents.includes('movies') || intents.includes('booking') || intents.includes('general') || intents.includes('price')) {
            let movieQuery = { status: { $in: ['NOW_SHOWING', 'COMING_SOON'] } };
            const titleMatch = message.match(/phim\s+["']?([^"'?!,\n]{2,30})["']?/i);
            let searchedSpecific = false;
            
            if (titleMatch) {
                const titleText = titleMatch[1].trim();
                const isGeneralQuery = /^(gì|nào|hay|hot|mới|chiếu|sắp|đang|không|ko|khong|được|nhất)$/i.test(titleText) || 
                                       /\b(gì|nào|hay|không|ko|khong|hot|mới)\b/i.test(titleText);
                if (!isGeneralQuery) {
                    movieQuery = { title: { $regex: titleText, $options: 'i' } };
                    searchedSpecific = true;
                }
            }

            let movies = await Movie.find(movieQuery)
                .populate('genres', 'name')
                .select('title description director cast durationMinutes releaseDate ageRating status genres')
                .limit(8)
                .lean();

            if (searchedSpecific && movies.length === 0) {
                movies = await Movie.find({ status: { $in: ['NOW_SHOWING', 'COMING_SOON'] } })
                    .populate('genres', 'name')
                    .select('title description director cast durationMinutes releaseDate ageRating status genres')
                    .limit(8)
                    .lean();
            }

            context.movies = movies.map((m) => ({
                id: m._id,
                title: m.title,
                description: (m.description || '').substring(0, 150),
                director: m.director || 'N/A',
                cast: m.cast || 'N/A',
                duration: m.durationMinutes,
                ageRating: m.ageRating,
                status: m.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu',
                genres: (m.genres || []).map((g) => g.name).join(', ') || 'N/A',
            }));
        }

        if (intents.includes('showtimes') || intents.includes('booking')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const showtimes = await Showtime.find({ startTime: { $gte: today } })
                .populate({ path: 'movie', select: 'title durationMinutes' })
                .populate({ path: 'auditorium', select: 'name' })
                .select('startTime movie auditorium baseTicketPrice')
                .sort({ startTime: 1 })
                .limit(20)
                .lean();

            context.showtimes = showtimes.map((s) => ({
                id: s._id,
                movie: s.movie?.title || 'N/A',
                auditorium: s.auditorium?.name || 'N/A',
                startTime: s.startTime,
                price: s.baseTicketPrice,
            }));
        }

        if (intents.includes('promotions')) {
            const now = new Date();
            const promotions = await Promotion.find({
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: true,
            })
                .select('name description discountType discountValue minOrderValue endDate code')
                .limit(5)
                .lean();
            context.promotions = promotions;
        }

        if (intents.includes('services')) {
            try {
                const ServiceModel = require('../models/service');
                const services = await ServiceModel.find({ isActive: true })
                    .select('name unitPrice description category')
                    .limit(8)
                    .lean();
                context.services = services;
            } catch (serviceErr) {
                console.error('[ChatbotService] Service DB error:', serviceErr.message);
            }
        }
    } catch (err) {
        console.error('[ChatbotService] DB error:', err.message);
    }
    return context;
}

function buildContextString(context, userContext) {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    let str = `\nDỮ LIỆU THỰC TẾ HỆ THỐNG (${dateStr}):\n`;
    let hasData = false;

    if (userContext) {
        hasData = true;
        str += `\nTHÔNG TIN NGƯỜI DÙNG ĐĂNG NHẬP:\n`;
        str += `• Tên: ${userContext.name}\n`;
        str += `• Điểm tích lũy (loyalty points): ${userContext.loyaltyPoints} điểm\n`;
        str += `• Phim yêu thích: ${userContext.favorites}\n`;
        if (userContext.recentTickets && userContext.recentTickets.length > 0) {
            str += `• Vé đã mua gần đây:\n`;
            userContext.recentTickets.forEach((t) => {
                str += `  - ${t}\n`;
            });
        }
    }

    if (context.movies?.length > 0) {
        hasData = true;
        str += '\nPHIM:\n';
        context.movies.forEach((m) => {
            str += `• [${m.status}] ${m.title} | ID Phim: ${m.id} | ${m.genres} | ${m.duration}ph | Đạo diễn: ${m.director} | ${m.description}\n`;
        });
    }
    if (context.showtimes?.length > 0) {
        hasData = true;
        str += '\nLỊCH CHIẾU:\n';
        context.showtimes.forEach((s) => {
            const t = new Date(s.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
            str += `• ${s.movie} | ${t} | Phòng: ${s.auditorium} | Giá: ${(s.price || 0).toLocaleString('vi-VN')}đ | ID: ${s.id}\n`;
        });
    }
    if (context.promotions?.length > 0) {
        hasData = true;
        str += '\nKHUYẾN MÃI:\n';
        context.promotions.forEach((p) => {
            const d = p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${(p.discountValue || 0).toLocaleString('vi-VN')}đ`;
            str += `• ${p.name}: Giảm ${d} | Mã: ${p.code} | HSD: ${new Date(p.endDate).toLocaleDateString('vi-VN')}\n`;
        });
    }
    if (context.services?.length > 0) {
        hasData = true;
        str += '\nDỊCH VỤ RẠP (BẮP NƯỚC & COMBO):\n';
        context.services.forEach((s) => {
            str += `• ${s.name} | Phân loại: ${s.category} | Giá: ${(s.unitPrice || 0).toLocaleString('vi-VN')}đ | Mô tả: ${s.description || 'N/A'}\n`;
        });
    }
    return hasData ? str : '';
}

function generateFallbackResponse(intents, contextData, userMessage) {
    if (intents.includes('showtimes') || intents.includes('booking')) {
        const showtimes = contextData.showtimes || [];
        if (showtimes.length === 0) {
            return {
                message: '📅 Hiện chưa có suất chiếu sắp tới. Bạn hãy xem danh sách phim và chọn phim muốn xem nhé!',
                actions: [{ type: 'navigate', label: '🎬 Chọn phim', path: '/movies' }],
            };
        }

        const byMovie = {};
        showtimes.forEach((s) => {
            if (!byMovie[s.movie]) byMovie[s.movie] = [];
            byMovie[s.movie].push(s);
        });

        let msg = '📅 **Lịch chiếu sắp tới:**\n\n';
        Object.entries(byMovie)
            .slice(0, 5)
            .forEach(([movieTitle, sessions]) => {
                msg += `🎬 **${movieTitle}**\n`;
                sessions.slice(0, 3).forEach((s) => {
                    const t = new Date(s.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
                    msg += `  • ${t} | ${s.auditorium} | ${(s.price || 0).toLocaleString('vi-VN')}đ\n`;
                });
            });
        
        const actions = [];
        const movies = contextData.movies || [];
        if (movies.length === 1) {
            msg += `\n👉 Nhấn nút dưới đây để xem chi tiết lịch chiếu và đặt vé phim **${movies[0].title}**!`;
            actions.push({ type: 'navigate', label: `🎟️ Đặt vé phim ${movies[0].title}`, path: `/movie/${movies[0].id}` });
        } else {
            msg += '\n👉 Chọn phim và nhấn **Đặt vé ngay** để tiến hành đặt chỗ!';
            actions.push({ type: 'navigate', label: '🎬 Xem tất cả phim', path: '/movies' });
        }

        return {
            message: msg,
            actions,
        };
    }

    if (intents.includes('movies') || intents.includes('general')) {
        const movies = contextData.movies || [];
        if (movies.length === 0) {
            return {
                message: '🎬 Hiện tại chưa có thông tin phim. Vui lòng xem danh sách phim đầy đủ tại trang Phim nhé!',
                actions: [{ type: 'navigate', label: '🎬 Xem tất cả phim', path: '/movies' }],
            };
        }

        const nowShowing = movies.filter((m) => m.status === 'Đang chiếu');
        const comingSoon = movies.filter((m) => m.status === 'Sắp chiếu');

        let msg = '';
        const actions = [];

        if (nowShowing.length > 0) {
            msg += '🎬 **Phim đang chiếu:**\n';
            nowShowing.forEach((m) => {
                msg += `• **${m.title}** | ${m.genres} | ${m.duration} phút | ${m.ageRating}\n`;
                if (m.description) msg += `  _${m.description.substring(0, 80)}..._\n`;
            });
        }
        if (comingSoon.length > 0) {
            if (msg) msg += '\n';
            msg += '📅 **Phim sắp chiếu:**\n';
            comingSoon.slice(0, 3).forEach((m) => {
                msg += `• **${m.title}** | ${m.genres} | ${m.duration} phút\n`;
            });
        }

        if (movies.length === 1) {
            const m = movies[0];
            msg += `\n💡 Bạn có muốn đặt vé hoặc xem lịch chiếu chi tiết phim **${m.title}** không?`;
            actions.push({ type: 'navigate', label: `🎟️ Xem chi tiết & đặt vé ${m.title}`, path: `/movie/${m.id}` });
        } else {
            if (msg) msg += '\n💡 Nhấn vào phim để xem chi tiết và đặt vé!';
            actions.push({ type: 'navigate', label: '🎬 Xem tất cả phim', path: '/movies' });
        }

        return {
            message: msg.trim() || 'Xem danh sách phim đầy đủ tại trang Phim!',
            actions,
        };
    }

    if (intents.includes('promotions')) {
        const promotions = contextData.promotions || [];
        if (promotions.length === 0) {
            return {
                message: '🎁 Hiện tại chưa có khuyến mãi đang hoạt động. Hãy theo dõi trang Khuyến mãi để cập nhật sớm nhất!',
                actions: [{ type: 'navigate', label: '🎁 Trang khuyến mãi', path: '/promotions' }],
            };
        }

        let msg = '🎁 **Khuyến mãi đang có:**\n\n';
        promotions.forEach((p) => {
            const d = p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${(p.discountValue || 0).toLocaleString('vi-VN')}đ`;
            msg += `🏷️ **${p.name}**\n`;
            msg += `  Giảm: **${d}** | Mã: \`${p.code}\`\n`;
            msg += `  HSD: ${new Date(p.endDate).toLocaleDateString('vi-VN')}\n\n`;
        });
        msg += '💡 Nhập mã khi thanh toán để được hưởng ưu đãi!';

        return {
            message: msg,
            actions: [{ type: 'navigate', label: '🎁 Xem khuyến mãi', path: '/promotions' }],
        };
    }

    if (intents.includes('price')) {
        const showtimes = contextData.showtimes || [];
        if (showtimes.length > 0) {
            const prices = showtimes.map((s) => s.price || 0).filter(Boolean);
            if (prices.length > 0) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return {
                    message: `💰 **Giá vé hiện tại:**\n\n• Từ: **${min.toLocaleString('vi-VN')}đ**\n• Đến: **${max.toLocaleString('vi-VN')}đ**\n\nGiá có thể thay đổi tùy ghế và suất chiếu. Ghế VIP/Couple sẽ có giá cao hơn ghế thường.`,
                    actions: [{ type: 'navigate', label: '🎬 Xem & đặt vé', path: '/movies' }],
                };
            }
        }
        return {
            message: '💰 Giá vé dao động từ **50.000đ - 150.000đ** tùy loại ghế và suất chiếu. Bạn có thể xem giá chính xác khi chọn suất chiếu cụ thể.',
            actions: [{ type: 'navigate', label: '🎬 Chọn phim', path: '/movies' }],
        };
    }

    if (intents.includes('policy')) {
        return {
            message: '📋 **Chính sách vé:**\n\n• 🔄 **Đổi vé**: Có thể đổi trước 2 giờ so với giờ chiếu\n• ❌ **Hủy vé**: Hoàn 70% giá vé nếu hủy trước 24 giờ\n• 💳 **Thanh toán**: VNPay, MoMo, thẻ tín dụng\n\nMọi thắc mắc vui lòng liên hệ nhân viên tại quầy hoặc hotline!',
            actions: [],
        };
    }

    if (intents.includes('services')) {
        const services = contextData.services || [];
        if (services.length === 0) {
            return {
                message: '🍿 Rạp có cung cấp các dịch vụ bắp nước và combo ăn kèm. Bạn vui lòng xem chi tiết thực đơn tại trang Dịch vụ nhé!',
                actions: [{ type: 'navigate', label: '🍿 Xem trang dịch vụ', path: '/services' }],
            };
        }

        let msg = '🍿 **Thực đơn bắp nước & dịch vụ tại quầy:**\n\n';
        services.forEach((s) => {
            msg += `• **${s.name}** (${s.category})\n`;
            msg += `  Giá: **${(s.unitPrice || 0).toLocaleString('vi-VN')}đ**\n`;
            if (s.description) msg += `  _${s.description}_\n`;
            msg += '\n';
        });
        msg += '💡 Bạn có thể đặt kèm bắp nước khi tiến hành đặt vé xem phim!';

        return {
            message: msg.trim(),
            actions: [{ type: 'navigate', label: '🍿 Xem trang dịch vụ', path: '/services' }],
        };
    }

    return {
        message: '🤖 Tôi có thể hỗ trợ bạn về:\n• 🎬 Phim đang & sắp chiếu\n• 📅 Lịch chiếu & đặt vé\n• 🎁 Khuyến mãi\n• 💰 Giá vé & chính sách\n\nBạn muốn hỏi gì ạ?',
        actions: [
            { type: 'navigate', label: '🎬 Xem phim', path: '/movies' },
        ],
    };
}

function parseActions(text) {
    let actions = [];
    let cleanText = text;
    const match = text.match(/\[ACTIONS:\s*([{\[][\s\S]+[}\]])\s*\]/);
    if (match) {
        cleanText = text.replace(/\[ACTIONS:\s*([{\[][\s\S]+[}\]])\s*\]/g, '').trim();
        try {
            const actionData = JSON.parse(match[1]);
            actions = Array.isArray(actionData) ? actionData : [actionData];
        } catch (e) {
            console.error('[ChatbotService] Failed to parse actions JSON:', e.message);
        }
    }
    return { cleanText, actions };
}

const ChatbotService = {
    async handleMessage(messages, currentUser) {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
        const intents = detectIntent(lastUserMsg);

        const lowerMsg = lastUserMsg.toLowerCase();
        if (/điểm|loyalty|tích lũy|hạng|phần thưởng/.test(lowerMsg)) intents.push('points');
        if (/vé|lịch sử|booking|đã mua|đã đặt/.test(lowerMsg)) intents.push('tickets');
        if (/yêu thích|favorite|thích/.test(lowerMsg)) intents.push('favorites');

        const contextData = await fetchContextData(intents, lastUserMsg);

        let userContext = null;
        if (currentUser) {
            try {
                const User = require('../models/user');
                const Booking = require('../models/booking');

                const user = await User.findById(currentUser.id)
                    .populate('favorites', 'title')
                    .lean();

                if (user) {
                    userContext = {
                        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'Thành viên',
                        loyaltyPoints: user.loyaltyPoints || 0,
                        favorites: (user.favorites || []).map((f) => f.title).join(', ') || 'Chưa có',
                    };

                    const recentBookings = await Booking.find({ user: currentUser.id, status: 'PAID' })
                        .populate({
                            path: 'showtime',
                            populate: { path: 'movie', select: 'title' },
                        })
                        .sort({ createdAt: -1 })
                        .limit(3)
                        .lean();

                    if (recentBookings && recentBookings.length > 0) {
                        userContext.recentTickets = recentBookings.map((b) => {
                            const date = b.showtime?.startTime
                                ? new Date(b.showtime.startTime).toLocaleString('vi-VN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                  })
                                : 'N/A';
                            return `${b.showtime?.movie?.title || 'N/A'} - Suất: ${date} - Số tiền: ${b.totalAmount.toLocaleString('vi-VN')}đ`;
                        });
                    }
                }
            } catch (err) {
                console.error('[ChatbotService] Error fetching user context:', err.message);
            }
        }

        if (GEMINI_API_KEY) {
            try {
                const contextString = buildContextString(contextData, userContext);
                const systemInstruction = contextString ? `${SYSTEM_PROMPT}\n${contextString}` : SYSTEM_PROMPT;

                const recentMessages = messages.slice(-12);
                const contents = recentMessages.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                }));
                if (contents.length === 0 || contents[0].role !== 'user') {
                    contents.unshift({ role: 'user', parts: [{ text: lastUserMsg || 'Xin chào' }] });
                }

                const rawText = await callGeminiAPI(systemInstruction, contents);
                const { cleanText, actions } = parseActions(rawText);

                return {
                    message: cleanText,
                    actions,
                    source: 'gemini',
                    contextUsed: {
                        moviesCount: contextData.movies?.length || 0,
                        showtimesCount: contextData.showtimes?.length || 0,
                        promotionsCount: contextData.promotions?.length || 0,
                    },
                };
            } catch (err) {
                console.log(`[ChatbotService] Gemini không khả dụng (${err.message}), dùng fallback.`);
            }
        }

        const fallback = generateFallbackResponse(intents, contextData, lastUserMsg);
        return {
            ...fallback,
            source: 'fallback',
            contextUsed: {
                moviesCount: contextData.movies?.length || 0,
                showtimesCount: contextData.showtimes?.length || 0,
                promotionsCount: contextData.promotions?.length || 0,
            },
        };
    },
};

module.exports = ChatbotService;
