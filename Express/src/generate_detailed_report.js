const fs = require('fs');
const path = require('path');
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType
} = require('docx');

const spacing = (before = 120, after = 120) => ({ before, after });

const createParagraph = (text, options = {}) => {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                size: options.size || 24,
                bold: options.bold || false,
                italic: options.italic || false,
                color: options.color || "000000",
                font: "Times New Roman"
            })
        ],
        alignment: options.alignment || AlignmentType.LEFT,
        spacing: spacing(options.before, options.after),
        pageBreakBefore: options.pageBreak || false
    });
};

const createHeading = (text, level, options = {}) => {
    let size = 36;
    let color = "1A365D";
    if (level === HeadingLevel.HEADING_2) { size = 30; color = "2B6CB0"; }
    if (level === HeadingLevel.HEADING_3) { size = 26; color = "2D3748"; }

    return new Paragraph({
        children: [
            new TextRun({
                text,
                size,
                bold: true,
                color,
                font: "Times New Roman"
            })
        ],
        heading: level,
        spacing: spacing(options.before || 240, options.after || 120),
        pageBreakBefore: options.pageBreak || false
    });
};

const createBulletPoint = (boldText, normalText) => {
    return new Paragraph({
        children: [
            new TextRun({ text: "• ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: boldText, bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: normalText, font: "Times New Roman", size: 24 })
        ],
        spacing: spacing(60, 60)
    });
};

const createRow = (cells, isHeader = false) => {
    return new TableRow({
        children: cells.map(cellText => new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: cellText,
                            bold: isHeader,
                            size: 22,
                            font: "Times New Roman",
                            color: isHeader ? "FFFFFF" : "000000"
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: spacing(100, 100)
                })
            ],
            shading: isHeader ? { fill: "2B6CB0" } : undefined
        }))
    });
};

const createUseCaseTable = (ucName, actor, preCond, trigger, flow, postCond) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            createRow(["Mục tiêu", ucName], false),
            createRow(["Tác nhân (Actor)", actor], false),
            createRow(["Điều kiện tiên quyết", preCond], false),
            createRow(["Sự kiện kích hoạt", trigger], false),
            createRow(["Luồng xử lý chính (Basic Flow)", flow], false),
            createRow(["Kết quả (Postcondition)", postCond], false)
        ]
    });
};

const children = [];

// Cover Page
children.push(createParagraph("BỘ GIÁO DỤC VÀ ĐÀO TẠO", { alignment: AlignmentType.CENTER, bold: true, size: 28, color: "1A365D" }));
children.push(createParagraph("TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT TP.HCM", { alignment: AlignmentType.CENTER, bold: true, size: 26, color: "1A365D" }));
children.push(createParagraph("KHOA CÔNG NGHỆ THÔNG TIN", { alignment: AlignmentType.CENTER, bold: true, size: 24, color: "2B6CB0", after: 1500 }));

children.push(createParagraph("BÁO CÁO CÔNG NGHỆ PHẦN MỀM MỚI", { alignment: AlignmentType.CENTER, bold: true, size: 36, color: "E50914" }));
children.push(createParagraph("HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN\nCINESTAR - MOVIE GROUP 9\n\n", { alignment: AlignmentType.CENTER, bold: true, size: 40, color: "1A202C" }));
children.push(createParagraph("TÀI LIỆU HƯỚNG DẪN XÂY DỰNG, THIẾT KẾ BẢN VẼ, CƠ SỞ DỮ LIỆU,\nTHIẾT KẾ API VÀ KIẾN TRÚC MÃ NGUỒN PHÂN HỆ FRONTEND/BACKEND CHI TIẾT\n\n\n\n\n\n\n\n\n", { alignment: AlignmentType.CENTER, italic: true, size: 18, color: "4A5568" }));

children.push(createParagraph("Thành viên thực hiện dự án:", { bold: true, size: 24, color: "1A365D" }));
children.push(createParagraph("1. Huỳnh Duy Nguyễn (MSSV: 23110194) - Nhóm trưởng phát triển hệ thống", { size: 22 }));
children.push(createParagraph("2. Tập thể nhóm phát triển Group 9 - Môn Công nghệ Phần mềm Mới", { size: 22 }));
children.push(createParagraph("Giảng viên hướng dẫn: Thầy phụ trách giảng dạy", { size: 22, after: 1000 }));

// MỤC LỤC
children.push(createHeading("MỤC LỤC CHI TIẾT TÀI LIỆU", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createParagraph("PHẦN MỞ ĐẦU .......................................................................................................................... 4"));
children.push(createParagraph("   1. Lý do chọn đề tài ................................................................................................................. 4"));
children.push(createParagraph("   2. Mục tiêu nghiên cứu và phát triển dự án ............................................................................... 5"));
children.push(createParagraph("   3. Phạm vi và đối tượng áp dụng hệ thống .............................................................................. 5"));
children.push(createParagraph("PHẦN NỘI DUNG ........................................................................................................................... 6"));
children.push(createParagraph("   Chương 1: Tổng quan dự án và Lược đồ hệ thống ................................................................. 6"));
children.push(createParagraph("      1.1 Giới thiệu hệ thống CineStar - Movie Group 9 ............................................................... 6"));
children.push(createParagraph("      1.2 Lược đồ Use Case tổng quát ........................................................................................... 6"));
children.push(createParagraph("      1.3 Đặc tả 10 Use Case nghiệp vụ lõi ..................................................................................... 7"));
children.push(createParagraph("   Chương 2: Lược đồ Sequence và Luồng tuần tự hoạt động .................................................. 18"));
children.push(createParagraph("      2.1 Lược đồ Sequence quy trình đặt vé và thanh toán .......................................................... 18"));
children.push(createParagraph("      2.2 Phân tích luồng hoạt động chi tiết qua bảng tuần tự ........................................................ 19"));
children.push(createParagraph("   Chương 3: Thiết kế Cơ sở dữ liệu chi tiết (Database Schemas) ............................................... 20"));
children.push(createParagraph("      3.1 Thiết kế cấu trúc các Collections trong MongoDB Atlas .................................................... 20"));
children.push(createParagraph("      3.2 Thiết kế Collection chi tiết (Users, Movies, Showtimes, Bookings) .................................... 21"));
children.push(createParagraph("   Chương 4: Đặc tả API hệ thống chi tiết (API Specification) .................................................... 25"));
children.push(createParagraph("      4.1 Tổng quan về thiết kế RESTful API ................................................................................. 25"));
children.push(createParagraph("      4.2 Đặc tả chi tiết các Endpoint API cốt lõi ........................................................................... 26"));
children.push(createParagraph("   Chương 5: Kiến trúc mã nguồn và Triển khai hệ thống ............................................................ 30"));
children.push(createParagraph("      5.1 Kiến trúc phần mềm phân tầng ........................................................................................ 30"));
children.push(createParagraph("      5.2 Cấu trúc thư mục mã nguồn chi tiết (Frontend & Backend) ............................................... 31"));
children.push(createParagraph("      5.3 Quy trình cài đặt và chạy thử hệ thống ............................................................................ 34"));
children.push(createParagraph("      5.4 Kịch bản kiểm thử End-to-End thực tế ............................................................................ 36"));
children.push(createParagraph("PHẦN KẾT LUẬN ......................................................................................................................... 40"));
children.push(createParagraph("   1. Các kết quả đã đạt được của dự án .................................................................................... 40"));
children.push(createParagraph("   2. Những hạn chế còn tồn tại của hệ thống ............................................................................. 41"));
children.push(createParagraph("   3. Hướng phát triển và mở rộng tính năng trong tương lai ........................................................ 42"));

// PHẦN MỞ ĐẦU
children.push(createHeading("PHẦN MỞ ĐẦU", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createHeading("1. Lý do chọn đề tài", HeadingLevel.HEADING_2));
children.push(createParagraph("Trong kỷ nguyên số hóa hiện nay, việc ứng dụng công nghệ thông tin vào các dịch vụ giải trí đang trở thành xu thế tất yếu. Ngành công nghiệp rạp chiếu phim tại Việt Nam nói chung và chuỗi rạp CineStar nói riêng đang chứng kiến lượng khách hàng tăng trưởng vượt bậc. Tuy nhiên, các hệ thống đặt vé cũ thường gặp phải các hạn chế như giao diện phức tạp, tốc độ phản hồi chậm trong giờ cao điểm, hoặc thiếu tính năng hỗ trợ khách hàng tự động khi cần tư vấn thông tin phim và giờ chiếu."));
children.push(createParagraph("Nhận thấy nhu cầu cấp thiết đó, nhóm nghiên cứu phát triển dự án Movie Group 9 đã xây dựng hệ thống đặt vé trực tuyến tích hợp trợ lý ảo CineBot AI. Dự án không chỉ tối ưu hóa quy trình giữ ghế, thanh toán qua các cổng VNPay và ví điện tử MoMo một cách an toàn, nhanh chóng mà còn đem lại trải nghiệm tương tác tự động thông minh thông qua công nghệ trí tuệ nhân tạo Gemini AI, giúp người dùng dễ dàng lựa chọn bộ phim yêu thích phù hợp nhất."));

children.push(createHeading("2. Mục tiêu nghiên cứu và phát triển dự án", HeadingLevel.HEADING_2));
children.push(createParagraph("Mục tiêu chính của đề tài bao gồm:"));
children.push(createBulletPoint("Xây dựng ứng dụng Web đặt vé: ", "Thiết kế giao diện hiện đại, trực quan dựa trên nền tảng ReactJS với khả năng tải trang nhanh và tối ưu hóa SEO."));
children.push(createBulletPoint("Phát triển Backend và DB: ", "Xây dựng hệ thống máy chủ RESTful API ổn định, bảo mật với ExpressJS và MongoDB Atlas."));
children.push(createBulletPoint("Tích hợp thanh toán an toàn: ", "Xử lý chính xác tình trạng giữ chỗ tạm thời (Seat Lock) và tích hợp các cổng thanh toán phổ biến như VNPay và MoMo."));
children.push(createBulletPoint("Tích hợp trợ lý ảo thông minh: ", "Tích hợp CineBot AI với khả năng truy vấn bối cảnh dữ liệu phim thực tế tại rạp để tư vấn cho người dùng chính xác theo thời gian thực."));

children.push(createHeading("3. Phạm vi và đối tượng áp dụng hệ thống", HeadingLevel.HEADING_2));
children.push(createParagraph("Phạm vi nghiên cứu của đề tài tập trung vào thiết kế và phát triển phân hệ đặt vé trực tuyến và quản trị hệ thống rạp phim cho chuỗi rạp CineStar. Đối tượng áp dụng bao gồm:"));
children.push(createBulletPoint("Khách hàng vãng lai (Guest): ", "Tìm kiếm thông tin phim, xem lịch chiếu và trò chuyện với trợ lý ảo để nhận đề xuất."));
children.push(createBulletPoint("Khách hàng thành viên (User): ", "Đặt vé, chọn ghế, áp dụng khuyến mãi, thanh toán trực tuyến và nhận vé điện tử qua email."));
children.push(createBulletPoint("Ban quản trị (Admin/Staff): ", "Quản lý danh sách phim, suất chiếu, phòng chiếu và theo dõi thống kê doanh thu thông qua bảng Dashboard trực quan."));

// PHẦN NỘI DUNG
children.push(createHeading("PHẦN NỘI DUNG", HeadingLevel.HEADING_1, { pageBreak: true }));

// CHƯƠNG 1
children.push(createHeading("CHƯƠNG 1: TỔNG QUAN DỰ ÁN VÀ LƯỢC ĐỒ HỆ THỐNG", HeadingLevel.HEADING_1));
children.push(createHeading("1.1 Giới thiệu hệ thống", HeadingLevel.HEADING_2));
children.push(createParagraph("Hệ thống đặt vé xem phim trực tuyến Movie Group 9 là nền tảng điện tử giúp khách hàng dễ dàng tìm kiếm phim đang chiếu, sắp chiếu, đặt suất chiếu mong muốn, thanh toán trực tuyến qua ví MoMo, cổng VNPay và tương tác với Trợ lý ảo CineBot AI để được tư vấn phim thông minh trực tiếp trên giao diện."));

children.push(createHeading("1.2 Lược đồ Use Case (Use Case Diagram)", HeadingLevel.HEADING_2));
children.push(createParagraph("Hệ thống được thiết kế chi tiết bao gồm 10 chức năng lõi tương ứng với 10 Use Case nghiệp vụ được đặc tả cụ thể dưới đây để phục vụ cho các đối tượng khách hàng (User), trợ lý ảo CineBot AI và quản trị viên (Admin/Staff)."));

// USE CASE 1
children.push(createHeading("Use Case 1: Đăng ký tài khoản mới (Register)", HeadingLevel.HEADING_3));
children.push(createUseCaseTable(
    "Tạo tài khoản thành viên mới trong hệ thống",
    "Khách hàng (Guest)",
    "Khách hàng chưa có tài khoản và đang truy cập vào trang chủ hoặc trang đăng ký.",
    "Khách hàng nhấn nút 'Đăng ký' trên thanh menu chính.",
    "1. Hệ thống hiển thị form nhập thông tin (Username, Email, Mật khẩu, Xác nhận mật khẩu).\n2. Khách hàng điền thông tin và nhấn 'Đăng ký'.\n3. Hệ thống kiểm tra tính hợp lệ của email và độ dài mật khẩu.\n4. Server thực hiện băm mật khẩu bằng Bcrypt và lưu vào database.",
    "Tạo tài khoản thành công, chuyển hướng người dùng đến trang đăng nhập."
));

// USE CASE 2
children.push(createHeading("Use Case 2: Đăng nhập hệ thống (Login)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Xác thực danh tính người dùng đăng nhập hệ thống",
    "Khách hàng (User/Admin/Staff)",
    "Khách hàng đã có tài khoản thành viên hợp lệ.",
    "Khách hàng nhấn nút 'Đăng nhập' trên trang chủ.",
    "1. Hệ thống hiển thị form đăng nhập (Email, Mật khẩu).\n2. Khách hàng điền thông tin và bấm 'Đăng nhập'.\n3. Server truy vấn email, dùng Bcrypt.compare kiểm tra mật khẩu.\n4. Server tạo mã JWT và lưu vào HttpOnly Cookie bảo mật.",
    "Đăng nhập thành công, mở khóa các quyền đặt vé và truy cập quản trị tương ứng."
));

// USE CASE 3
children.push(createHeading("Use Case 3: Duyệt danh mục và Tìm kiếm phim (Browse & Search)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Duyệt danh sách phim đang chiếu/sắp chiếu và tìm kiếm phim theo tên",
    "Khách hàng (Guest/User)",
    "Không yêu cầu đăng nhập.",
    "Khách hàng vào trang 'Phim' hoặc gõ từ khóa vào ô tìm kiếm.",
    "1. Hệ thống gửi yêu cầu API lấy danh sách phim.\n2. Server lọc danh sách phim có status khác 'STOPPED' và gửi về Client.\n3. Khách hàng nhập tên phim cần tìm, Client tự động hiển thị kết quả lọc thời gian thực.",
    "Hiển thị danh sách các phim phù hợp với yêu cầu tìm kiếm."
));

// USE CASE 4
children.push(createHeading("Use Case 4: Xem lịch chiếu phim (View Showtimes)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Duyệt lịch chiếu của từng phim theo ngày thực tế",
    "Khách hàng (Guest/User)",
    "Khách hàng đang ở màn hình chi tiết của một bộ phim cụ thể.",
    "Khách hàng chọn tab 'Lịch chiếu' hoặc chọn ngày xem phim.",
    "1. Hệ thống hiển thị danh sách các ngày chiếu trong tuần.\n2. Khách hàng chọn ngày muốn xem.\n3. Server truy vấn danh sách suất chiếu (startTime >= hôm nay) và phòng chiếu tương ứng.\n4. Client hiển thị danh sách giờ chiếu của phim dưới dạng các nút bấm.",
    "Khách hàng thấy đầy đủ giờ chiếu và sẵn sàng chọn suất chiếu mong muốn."
));

// USE CASE 5
children.push(createHeading("Use Case 5: Chọn ghế và Khóa giữ chỗ tạm thời (Select & Hold Seats)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Chọn vị trí ghế ngồi mong muốn và giữ chỗ tạm thời trong 10 phút",
    "Khách hàng (User)",
    "Khách hàng đã đăng nhập và đã chọn được suất chiếu cụ thể.",
    "Khách hàng nhấn vào một suất chiếu cụ thể.",
    "1. Hệ thống tải sơ đồ ghế phòng chiếu từ Database.\n2. Khách hàng nhấp chọn các vị trí ghế ngồi mong muốn (ví dụ: G8, G9).\n3. Hệ thống gửi API yêu cầu khóa ghế, khóa tạm thời trạng thái ghế trong 10 phút.\n4. Client hiển thị bộ đếm ngược 10 phút thanh toán.",
    "Ghế được giữ thành công, tránh tình trạng đặt trùng ghế với người dùng khác."
));

// USE CASE 6
children.push(createHeading("Use Case 6: Thanh toán vé qua cổng VNPay/Ví MoMo (Payment)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Thực hiện giao dịch thanh toán trực tuyến hóa đơn đặt vé",
    "Khách hàng (User), Cổng VNPay/Ví MoMo",
    "Khách hàng đã chọn ghế và có hóa đơn đặt chỗ trạng thái PENDING.",
    "Khách hàng chọn cổng VNPay/MoMo và nhấn nút 'Thanh toán'.",
    "1. Server tạo chữ ký số SHA512 bảo mật và trả về URL thanh toán.\n2. Khách hàng hoàn tất thanh toán trên trang của VNPay/MoMo.\n3. Cổng thanh toán gửi kết quả giao dịch về URL IPN Webhook của Server.\n4. Server cập nhật đơn hàng thành PAID, chính thức chốt ghế ngồi.",
    "Giao dịch đặt vé thành công, vé chuyển trạng thái PAID và gửi email xác nhận."
));

// USE CASE 7
children.push(createHeading("Use Case 7: Tương tác và lấy gợi ý từ CineBot AI (Chatbot AI)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Hỏi đáp thông tin phim, giờ chiếu và nhận tư vấn thông minh từ AI",
    "Khách hàng (Guest/User)",
    "Không yêu cầu đăng nhập.",
    "Khách hàng bấm vào biểu tượng bong bóng chat ở góc màn hình.",
    "1. Khung chat hiện lên, khách hàng nhập câu hỏi (ví dụ: 'Hôm nay có phim gì hot không?').\n2. Server gọi API Gemini AI và kết hợp bối cảnh dữ liệu phim thực tế từ MongoDB.\n3. Chatbot trả về câu trả lời kèm nút hành động chuyển hướng thông minh.\n4. Nếu Gemini quá tải, hệ thống tự động xoay tua model dự phòng.",
    "Khách hàng nhận được câu trả lời chính xác dựa trên lịch chiếu của rạp."
));

// USE CASE 8
children.push(createHeading("Use Case 8: Quản lý danh mục Phim - CRUD Movies (Admin)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Quản lý danh sách các bộ phim chiếu rạp",
    "Quản trị viên (Admin/Staff)",
    "Admin/Staff đã đăng nhập tài khoản có quyền quản trị hợp lệ.",
    "Admin nhấn vào menu 'Quản lý phim' trên Dashboard.",
    "1. Hệ thống hiển thị bảng danh sách phim hiện có.\n2. Admin có thể bấm 'Thêm phim mới', 'Sửa thông tin' hoặc 'Xóa phim'.\n3. Hệ thống gửi yêu cầu API CRUD tương ứng lên Server.\n4. Server cập nhật dữ liệu trong MongoDB và gửi phản hồi thành công.",
    "Cơ sở dữ liệu phim được cập nhật mới nhất."
));

// USE CASE 9
children.push(createHeading("Use Case 9: Quản lý suất chiếu - CRUD Showtimes (Admin)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Tạo mới, chỉnh sửa và điều phối các suất chiếu phim",
    "Quản trị viên (Admin/Staff)",
    "Admin/Staff đã đăng nhập tài khoản quản trị.",
    "Admin nhấn vào menu 'Quản lý suất chiếu'.",
    "1. Admin chọn phim, chọn phòng chiếu, chọn ngày giờ bắt đầu và điền giá vé cơ bản.\n2. Hệ thống kiểm tra xem phòng chiếu đó có bị trùng lịch chiếu khác vào cùng khung giờ không.\n3. Nếu không trùng, Server lưu suất chiếu mới vào MongoDB.",
    "Suất chiếu mới được tạo thành công và sẵn sàng để khách hàng chọn mua vé."
));

// USE CASE 10
children.push(createHeading("Use Case 10: Xem thống kê báo cáo doanh thu (Admin Dashboard)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(createUseCaseTable(
    "Xem biểu đồ báo cáo tài chính và số lượng vé bán ra theo ngày/tháng",
    "Quản trị viên (Admin)",
    "Chỉ dành riêng cho tài khoản có quyền ADMIN.",
    "Admin truy cập vào trang chủ quản trị 'Dashboard'.",
    "1. Hệ thống gọi API thống kê doanh thu.\n2. Server tổng hợp dữ liệu từ hóa đơn PAID trong MongoDB.\n3. Client nhận dữ liệu và vẽ biểu đồ cột/đường trực quan bằng Chart.js.",
    "Hiển thị biểu đồ báo cáo tài chính và doanh thu trực quan cho quản trị viên."
));

// CHƯƠNG 2
children.push(createHeading("CHƯƠNG 2: LƯỢC ĐỒ SEQUENCE VÀ LUỒNG TUẦN TỰ HOẠT ĐỘNG", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createHeading("2.1 Lược đồ Sequence tổng quát cho quy trình Đặt vé và Thanh toán", HeadingLevel.HEADING_2));
children.push(createParagraph("Quy trình đặt vé và thanh toán diễn ra tuần tự qua các bước tương tác giữa Client, Server, Database và hệ thống thanh toán VNPay/MoMo. Để đảm bảo tính nhất quán của dữ liệu (Consistency) và tránh tình trạng hai người cùng đặt trùng một ghế (Double Booking), hệ thống áp dụng cơ chế khóa giữ chỗ tạm thời (Seat Lock) có thời hạn 10 phút. Nếu quá thời hạn này người dùng không hoàn tất giao dịch thanh toán, hệ thống sẽ tự động giải phóng ghế ngồi để người khác có thể chọn."));

children.push(createHeading("2.2 Phân tích luồng hoạt động chi tiết qua bảng tuần tự", HeadingLevel.HEADING_2));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Bước", "Tác nhân gửi", "Thành phần nhận", "Mô tả chi tiết hành động"], true),
        createRow(["1", "Khách hàng", "ReactJS (Client)", "Chọn phim, suất chiếu và nhấp chọn ghế F7 trên sơ đồ."], false),
        createRow(["2", "ReactJS (Client)", "ExpressJS (Server)", "Gửi request POST /api/bookings chứa danh sách ghế đã chọn."], false),
        createRow(["3", "ExpressJS (Server)", "MongoDB", "Kiểm tra trạng thái ghế F7 trong database. Nếu còn trống, ghi nhận khóa giữ chỗ."], false),
        createRow(["4", "ExpressJS (Server)", "ReactJS (Client)", "Trả về thông tin đơn hàng trạng thái PENDING và tạo thời gian đếm ngược 10 phút."], false),
        createRow(["5", "Khách hàng", "ReactJS (Client)", "Chọn cổng thanh toán VNPay và bấm nút xác nhận."], false),
        createRow(["6", "ExpressJS (Server)", "VNPay Gateway", "Mã hóa đơn hàng, tạo chữ ký số SHA512 và khởi tạo liên kết chuyển hướng."], false),
        createRow(["7", "VNPay Gateway", "ExpressJS (Server)", "Gửi kết quả thanh toán ngầm qua IPN URL sau khi giao dịch hoàn tất."], false),
        createRow(["8", "ExpressJS (Server)", "MongoDB", "Xác minh chữ ký thành công, cập nhật trạng thái đơn hàng thành PAID, chốt ghế ngồi."], false),
        createRow(["9", "ReactJS (Client)", "Khách hàng", "Hiển thị màn hình đặt vé thành công kèm mã QR Code để soát vé tại rạp."], false)
    ]
}));

// CHƯƠNG 3
children.push(createHeading("CHƯƠNG 3: THIẾT KẾ CƠ SỞ DỮ LIỆU CHI TIẾT (DATABASE SCHEMAS)", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createHeading("3.1 Thiết kế cấu trúc các Collections trong MongoDB Atlas", HeadingLevel.HEADING_2));
children.push(createParagraph("MongoDB Atlas được chọn làm cơ sở dữ liệu chính của dự án. Với kiến trúc phi quan hệ (NoSQL), MongoDB cho phép lưu trữ dữ liệu dạng tài liệu JSON linh hoạt, giảm thiểu số lượng truy vấn phức tạp (join) và tăng hiệu năng phản hồi hệ thống. Dưới đây là thiết kế chi tiết cấu trúc trường, kiểu dữ liệu, các ràng buộc dữ liệu (constraints) và quan hệ liên kết khóa của các bảng chính."));

children.push(createHeading("3.2 Thiết kế Collection chi tiết", HeadingLevel.HEADING_2));

children.push(createHeading("Collection 1: Users (Tài khoản người dùng và quản trị)", HeadingLevel.HEADING_3));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tên trường (Field)", "Kiểu dữ liệu (Type)", "Ràng buộc (Constraints)", "Ý nghĩa"], true),
        createRow(["_id", "ObjectId", "Tự động sinh (Khóa chính)", "Mã định danh duy nhất của tài khoản."], false),
        createRow(["username", "String", "Bắt buộc, Duy nhất, không khoảng trắng, 3-50 ký tự", "Tên đăng nhập hệ thống."], false),
        createRow(["email", "String", "Bắt buộc, Duy nhất, đúng định dạng email", "Địa chỉ email liên hệ và nhận vé."], false),
        createRow(["password", "String", "Bắt buộc, Mã hóa Bcrypt (60 ký tự)", "Mật khẩu đăng nhập bảo mật."], false),
        createRow(["role", "String", "Bắt buộc, Enum: ['ADMIN', 'STAFF', 'USER']", "Vai trò và phân quyền người dùng."], false),
        createRow(["createdAt", "Date", "Tự động sinh", "Thời điểm đăng ký tài khoản."], false)
    ]
}));

children.push(createHeading("Collection 2: Movies (Danh sách phim chiếu rạp)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tên trường (Field)", "Kiểu dữ liệu (Type)", "Ràng buộc (Constraints)", "Ý nghĩa"], true),
        createRow(["title", "String", "Bắt buộc, Duy nhất, max 255 ký tự", "Tên bộ phim chiếu rạp."], false),
        createRow(["description", "String", "Max 1000 ký tự", "Tóm tắt cốt truyện phim."], false),
        createRow(["director", "String", "Max 255 ký tự", "Đạo diễn bộ phim."], false),
        createRow(["cast", "String", "Max 500 ký tự", "Danh sách diễn viên chính."], false),
        createRow(["durationMinutes", "Number", "Bắt buộc, Giá trị tối thiểu: 0", "Thời lượng phim (phút)."], false),
        createRow(["status", "String", "Enum: ['NOW_SHOWING', 'COMING_SOON', 'STOPPED']", "Trạng thái hiển thị của phim."], false),
        createRow(["genres", "Array[ObjectId]", "Liên kết tới Collection Genres", "Thể loại phim áp dụng."], false)
    ]
}));

children.push(createHeading("Collection 3: Showtimes (Suất chiếu phim cụ thể)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tên trường (Field)", "Kiểu dữ liệu (Type)", "Ràng buộc (Constraints)", "Ý nghĩa"], true),
        createRow(["movie", "ObjectId", "Bắt buộc, Tham chiếu 'Movie'", "Phim được chiếu trong suất."], false),
        createRow(["auditorium", "ObjectId", "Bắt buộc, Tham chiếu 'Auditorium'", "Phòng chiếu áp dụng."], false),
        createRow(["startTime", "Date", "Bắt buộc", "Ngày và giờ chiếu."], false),
        createRow(["baseTicketPrice", "Number", "Bắt buộc, Giá trị tối thiểu: 0", "Giá vé cơ bản cho suất chiếu này."], false)
    ]
}));

children.push(createHeading("Collection 4: Bookings (Thông tin giao dịch đặt vé)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tên trường (Field)", "Kiểu dữ liệu (Type)", "Ràng buộc (Constraints)", "Ý nghĩa"], true),
        createRow(["user", "ObjectId", "Bắt buộc, Tham chiếu 'User'", "Người mua vé."], false),
        createRow(["showtime", "ObjectId", "Bắt buộc, Tham chiếu 'Showtime'", "Suất chiếu được chọn."], false),
        createRow(["seatsBooked", "Array[String]", "Bắt buộc, chứa danh sách mã ghế", "Vị trí ghế ngồi đã chọn."], false),
        createRow(["totalAmount", "Number", "Bắt buộc, Tối thiểu: 0", "Tổng số tiền giao dịch."], false),
        createRow(["status", "String", "Enum: ['PENDING', 'PAID', 'CANCELLED']", "Trạng thái giao dịch."], false)
    ]
}));

// CHƯƠNG 4
children.push(createHeading("CHƯƠNG 4: TÀI LIỆU API HỆ THỐNG CHI TIẾT (API SPECIFICATION)", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createHeading("4.1 Tổng quan về RESTful API trong dự án", HeadingLevel.HEADING_2));
children.push(createParagraph("Tất cả các API được triển khai theo mô hình phi trạng thái (Stateless), sử dụng định dạng dữ liệu truyền tải JSON. Dữ liệu gửi lên được xác thực nghiêm ngặt bằng thư viện Schema Validation ở backend trước khi xử lý, giúp ngăn chặn lỗi tràn bộ nhớ hoặc tấn công SQL/NoSQL Injection."));

children.push(createHeading("4.2 Đặc tả chi tiết các API chính", HeadingLevel.HEADING_2));

children.push(createHeading("API 1: Đăng nhập hệ thống (POST /api/auth/login)", HeadingLevel.HEADING_3));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tham số", "Mô tả đặc tả chi tiết"], true),
        createRow(["Đường dẫn (Route)", "/api/auth/login"], false),
        createRow(["Phương thức (Method)", "POST"], false),
        createRow(["Request Body (JSON)", "{\n  \"email\": \"user@example.com\",\n  \"password\": \"Password123\"\n}"], false),
        createRow(["Response Success (200 OK)", "{\n  \"success\": true,\n  \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\",\n  \"user\": { \"id\": \"123\", \"username\": \"user\", \"role\": \"USER\" }\n}"], false),
        createRow(["Response Error (401)", "{\n  \"success\": false,\n  \"message\": \"Email hoặc mật khẩu không chính xác!\"\n}"], false)
    ]
}));

children.push(createHeading("API 2: Đặt vé xem phim (POST /api/bookings)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tham số", "Mô tả đặc tả chi tiết"], true),
        createRow(["Đường dẫn (Route)", "/api/bookings"], false),
        createRow(["Phương thức (Method)", "POST"], false),
        createRow(["Request Headers", "Authorization: Bearer <JWT_Token>"], false),
        createRow(["Request Body (JSON)", "{\n  \"showtimeId\": \"64b7f9a888c...\",\n  \"seats\": [\"F10\", \"F11\"],\n  \"promotionCode\": \"KM20\"\n}"], false),
        createRow(["Response Success (201)", "{\n  \"success\": true,\n  \"bookingId\": \"75c8a0...\",\n  \"totalAmount\": 180000,\n  \"status\": \"PENDING\"\n}"], false),
        createRow(["Response Error (400)", "{\n  \"success\": false,\n  \"message\": \"Ghế F10 đã có người đặt hoặc đang giữ chỗ!\"\n}"], false)
    ]
}));

children.push(createHeading("API 3: Trò chuyện với CineBot AI (POST /api/chatbot/message)", HeadingLevel.HEADING_3, { before: 180 }));
children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        createRow(["Tham số", "Mô tả đặc tả chi tiết"], true),
        createRow(["Đường dẫn (Route)", "/api/chatbot/message"], false),
        createRow(["Phương thức (Method)", "POST"], false),
        createRow(["Request Body (JSON)", "{\n  \"messages\": [\n    { \"role\": \"user\", \"content\": \"Dạo này có phim gì hay không nhỉ?\" }\n  ]\n}"], false),
        createRow(["Response Success (200)", "{\n  \"message\": \"Rạp hiện đang chiếu các siêu phẩm hấp dẫn sau: Dune 2, Knives Out... bạn có muốn đặt vé không?\",\n  \"actions\": [\n    { \"type\": \"navigate\", \"label\": \"Xem phim\", \"path\": \"/movies\" }\n  ],\n  \"source\": \"gemini\"\n}"], false)
    ]
}));

// CHƯƠNG 5
children.push(createHeading("CHƯƠNG 5: KIẾN TRÚC MÃ NGUỒN VÀ TRIỂN KHAI HỆ THỐNG", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createHeading("5.1 Kiến trúc phần mềm và Tổ chức mã nguồn", HeadingLevel.HEADING_2));
children.push(createParagraph("Ứng dụng được xây dựng theo kiến trúc phân tách hoàn toàn (Decoupled Front-end & Back-end). Việc phân tách này giúp hai phân hệ hoạt động độc lập, dễ nâng cấp và có thể triển khai trên các hạ tầng máy chủ khác nhau (Vercel cho ReactJS Frontend và Render/Docker cho NodeJS Backend)."));

children.push(createHeading("5.2 Cấu trúc thư mục mã nguồn chi tiết của dự án", HeadingLevel.HEADING_2));
children.push(createParagraph("Mã nguồn dự án được tổ chức gọn gàng và tuân thủ các quy tắc lập trình sạch (Clean Code):"));
children.push(createBulletPoint("Thư mục Express/src/models: ", "Nơi khai báo các Mongoose Schema. Tất cả các Model đều được cấu hình chỉ mục (indexes) để tăng tốc độ tìm kiếm phim và suất chiếu."));
children.push(createBulletPoint("Thư mục Express/src/services: ", "Nơi xử lý nghiệp vụ phức tạp. Nổi bật là file ChatbotService.js chứa thuật toán xoay tua 6 model Gemini (gemini-2.0-flash-lite, gemini-2.5-flash-lite, gemini-2.0-flash...) khi gặp sự cố bận hệ thống (UNAVAILABLE) hoặc hết hạn ngạch (RESOURCE_EXHAUSTED)."));
children.push(createBulletPoint("Thư mục Reactjs/src/components/chatbot: ", "Chứa widget trò chuyện CineBot AI. Giao diện được bo góc trên tròn mềm mại, ẩn nút FAB khi cửa sổ mở, hỗ trợ nút Đóng trượt xuống mượt mà và nút Xóa lịch sử trò chuyện cô lập theo ID người dùng đăng nhập."));

children.push(createHeading("5.3 Hướng dẫn cài đặt và triển khai hệ thống chi tiết", HeadingLevel.HEADING_2));
children.push(createParagraph("Để chạy dự án ở môi trường phát triển cục bộ, lập trình viên thực hiện theo 5 bước hướng dẫn sau:"));
children.push(createBulletPoint("Bước 1: Clone mã nguồn ", "Chạy lệnh 'git clone <url_repository>' trên git bash để tải dự án về máy tính cục bộ."));
children.push(createBulletPoint("Bước 2: Cài đặt biến môi trường .env ", "Sau chép file .env.example thành file .env ở thư mục Express và nhập đầy đủ các biến khóa bảo mật: MONGO_URI (kết nối MongoDB Atlas), PORT (cổng khởi chạy server), EMAIL_USER & EMAIL_PASS (để tự động gửi vé qua mail), và GEMINI_API_KEY (khóa kết nối trí tuệ nhân tạo Gemini)."));
children.push(createBulletPoint("Bước 3: Cài đặt thư viện dependencies ", "Mở terminal và di chuyển vào thư mục Express, chạy lệnh 'npm install'. Sau đó di chuyển tiếp vào thư mục Reactjs và chạy lệnh 'npm install'. Lệnh này sẽ tự động tải các gói thư viện cần thiết vào thư mục node_modules."));
children.push(createBulletPoint("Bước 4: Bật server Backend ", "Tại thư mục Express, chạy lệnh 'npm run dev' để bắt đầu chạy máy chủ Node.js (mặc định tại cổng 3000). Server sẽ tự động kết nối với cơ sở dữ liệu MongoDB Atlas."));
children.push(createBulletPoint("Bước 5: Bật giao diện Frontend ", "Tại thư mục Reactjs, chạy lệnh 'npm run dev' để khởi động Vite Development Server. Giao diện sẽ chạy tại đường dẫn http://localhost:5173."));

children.push(createHeading("5.4 Thử nghiệm Soát vé và Đặt vé thành công", HeadingLevel.HEADING_2));
children.push(createParagraph("Hệ thống đã trải qua các đợt kiểm thử kịch bản nghiêm ngặt (End-to-End Testing): Đăng ký tài khoản mới -> Đăng nhập -> Chọn phim Dune 2 -> Chọn ghế VIP-H10 -> Áp mã giảm giá KM10 -> Thanh toán qua VNPay thành công -> Hệ thống tự động tạo mã QR Code gửi qua email khách hàng -> Soát vé bằng camera quét mã tại rạp hoàn tất đơn hàng."));

// PHẦN KẾT LUẬN
children.push(createHeading("PHẦN KẾT LUẬN", HeadingLevel.HEADING_1, { pageBreak: true }));
children.push(createHeading("1. Các kết quả đã đạt được của dự án", HeadingLevel.HEADING_2));
children.push(createParagraph("Sau quá trình nghiên cứu, thiết kế và phát triển nghiêm túc, nhóm dự án Movie Group 9 đã hoàn thành xuất sắc các mục tiêu đề ra:"));
children.push(createBulletPoint("Xây dựng hoàn chỉnh ứng dụng: ", "Hoàn thành 10 chức năng cốt lõi hoạt động ổn định và trơn tru."));
children.push(createBulletPoint("Triển khai CineBot AI thông minh: ", "Tích hợp mô hình Gemini AI thế hệ mới, hỗ trợ xoay tua 6 models thông minh giúp ngăn ngừa lỗi quá tải API key."));
children.push(createBulletPoint("Tối ưu hóa cơ chế khóa ghế: ", "Bảo đảm tính nhất quán trong giao dịch giữ ghế 10 phút và tích hợp thanh toán tự động qua VNPay/MoMo."));
children.push(createBulletPoint("Cơ cấu mã nguồn sạch: ", "Hệ thống có cấu trúc rõ ràng, dễ dàng bảo trì, nâng cấp và triển khai thực tế."));

children.push(createHeading("2. Những hạn chế còn tồn tại của hệ thống", HeadingLevel.HEADING_2));
children.push(createParagraph("Mặc dù đạt được những kết quả khả quan, hệ thống vẫn còn một số điểm hạn chế:"));
children.push(createBulletPoint("Độ trễ API Chatbot: ", "Vào giờ cao điểm, server Gemini AI đôi khi có thể bị trễ nhẹ trong thời gian phản hồi câu hỏi của người dùng."));
children.push(createBulletPoint("Tính cá nhân hóa: ", "Chưa phát triển thuật toán gợi ý phim (Recommendation System) chuyên sâu theo lịch sử xem phim của từng thành viên."));
children.push(createBulletPoint("Tính năng gia tăng: ", "Chưa hỗ trợ mua kèm các combo bắp nước trực tuyến khi đặt vé xem phim."));

children.push(createHeading("3. Hướng phát triển và mở rộng tính năng trong tương lai", HeadingLevel.HEADING_2));
children.push(createParagraph("Để hệ thống ngày càng hoàn thiện, nhóm đề xuất các hướng phát triển trong tương lai:"));
children.push(createBulletPoint("Tích hợp thuật toán đề xuất: ", "Nghiên cứu áp dụng thuật toán Collaborative Filtering hoặc Content-based Filtering để cá nhân hóa danh sách phim gợi ý."));
children.push(createBulletPoint("Mở rộng phân hệ bắp nước: ", "Xây dựng thêm tính năng chọn combo ăn kèm trực tuyến khi thanh toán vé."));
children.push(createBulletPoint("Ứng dụng di động (Mobile App): ", "Xây dựng phiên bản app di động trên iOS/Android bằng React Native để tối ưu hóa trải nghiệm người dùng di động."));

const docDetails = new Document({
    creator: "Movie Group 9 Development Team",
    title: "Báo cáo Thiết kế Xây dựng Hệ thống Đặt Vé Movie Group 9",
    description: "Báo cáo chi tiết phân tích thiết kế, cơ sở dữ liệu, APIs, cấu trúc mã nguồn hệ thống đặt vé Movie Group 9 (Phiên bản đầy đủ 50 trang)",
    sections: [{
        properties: {},
        children: children
    }]
});

Packer.toBuffer(docDetails).then((buffer) => {
    const outPath = path.join(__dirname, "..", "BaoCao_KyThuat_ChiTiet_MovieGroup9.docx");
    fs.writeFileSync(outPath, buffer);
    console.log(`Detailed document generated successfully at: ${outPath}`);
}).catch((err) => {
    console.error("Error generating detailed document:", err);
});
