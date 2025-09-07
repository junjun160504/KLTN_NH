import { useEffect, useRef, useState } from "react";
import "../styles/trangchu.css";

export default function Home() {
    const images = [
        { src: "/images/Banner.png", alt: "Không gian nhà hàng" },
        { src: "/images/Banner2.jpg", alt: "Ẩm thực miền Nam" },
    ];

    const [current, setCurrent] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCurrent((c) => (c + 1) % images.length);
        }, 5000);
        return () => clearInterval(timerRef.current);
    }, []);

    return (
        <div className="welcome-body">
            <div className="welcome-container">
                {/* Logo */}
                <div className="logo-section">
                    <img src="/images/LogoNhaHang.png" alt="Phuong Nam Logo" className="logo-img" />
                </div>

                {/* Info */}
                <div className="restaurant-info">
                    <h2 className="restaurant-name">Nhà hàng Phương Nam</h2>
                    <div className="restaurant-address">Số 13 Mai Hắc Đế, phường Nguyễn Du, quận Hai Bà Trưng</div>
                </div>

                {/* Greeting */}
                <div className="greeting-row">
                    <span className="greeting-icon"><i className="fa-solid fa-sun"></i></span>
                    <span className="greeting-text">Chào buổi trưa Quý khách</span>
                    <span className="table-badge">Bàn: C8</span>
                </div>

                {/* Banner carousel */}
                <div className="banner-section">
                    {images.map((im, i) => (
                        <img key={im.src} src={im.src} alt={im.alt} className={`banner-img ${current === i ? "active" : ""}`} />
                    ))}
                    <div className="banner-overlay">
                        <div className="banner-title">Ẩm thực miền Nam</div>
                        <div className="banner-desc">Đậm đà hương vị</div>
                    </div>
                </div>

                {/* Feature grid */}
                <div className="feature-grid">
                    <a href="/phone" className="feature-card blue">
                        <i className="fa-solid fa-id-card"></i>
                        <span>Nhập số điện thoại tích điểm</span>
                    </a>
                    <a href="/payment" className="feature-card green">
                        <i className="fa-solid fa-money-check-dollar"></i>
                        <span>Thanh toán</span>
                    </a>
                    <a href="/call-staff" className="feature-card purple">
                        <i className="fa-solid fa-bell-concierge"></i>
                        <span>Gọi nhân viên</span>
                    </a>
                    <a href="/feedback" className="feature-card orange">
                        <i className="fa-solid fa-star"></i>
                        <span>Đánh giá</span>
                    </a>
                </div>

                {/* Menu button */}
                <a href="/menu" className="menu-btn">
                    <i className="fa-solid fa-utensils"></i>
                    <span>Xem Menu - Gọi món</span>
                </a>
            </div>

            {/* Chatbot button */}
            <button className="chatbot-btn" title="Hỏi chatbot">
                <i className="fa-solid fa-message"></i>
            </button>
        </div>
    );
}
