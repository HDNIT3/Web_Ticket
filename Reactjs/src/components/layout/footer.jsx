
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="container-fluid px-3 px-lg-4">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand-mark brand-mark--footer">
              <span className="brand-logo">CH</span>
              <div className="brand-text">
                <strong>CinemaHCMUTE</strong>
                <small>Trải nghiệm điện ảnh đỉnh cao</small>
              </div>
            </div>
            <p className="footer-description">
              Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam, mang đến trải nghiệm điện ảnh chân thực và sống động nhất.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Về Chúng Tôi</h4>
              <ul>
                <li><button className="link-button footer-link">Giới thiệu</button></li>
                <li><button className="link-button footer-link">Tiện ích rạp</button></li>
                <li><button className="link-button footer-link">Tuyển dụng</button></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Hỗ Trợ</h4>
              <ul>
                <li><button className="link-button footer-link">Câu hỏi thường gặp</button></li>
                <li><button className="link-button footer-link">Điều khoản sử dụng</button></li>
                <li><button className="link-button footer-link">Chính sách bảo mật</button></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Liên Hệ</h4>
              <ul>
                <li>Email: support@cinemahcmute.vn</li>
                <li>Hotline: 1900 1234</li>
                <li>Địa chỉ: Võ Văn Ngân, Thủ Đức, TP. HCM</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} CinemaHCMUTE. All rights reserved. Design for Movie_Group9_CCNPMM_02.</p>
        </div>
      </div>
    </footer>
  )
}
