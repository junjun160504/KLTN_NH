import { useEffect, useMemo, useState } from "react";
import "../styles/menu.css";

const TABS = ["Tất cả", "Món chính", "Đồ uống", "Tráng miệng", "Khuyến mãi"];

const MENU_ITEMS = [
    { id: 1, title: "Cá đặc sản Phương Nam muối ớt", price: 58000, desc: "Cá thòi lòi Cà Màu", img: "/images/ca_thoi_loi_nuong_muoi_ot.jpg", category: "monchinh" },
    { id: 2, title: "Bánh Mì Thịt Nướng", price: 35000, desc: "Bánh mì thịt nướng thơm ngon", img: "/images/banh_mi.jpg", category: "khuyenmai" },
    { id: 3, title: "Cơm Tấm Sườn Nướng", price: 50000, desc: "Cơm tấm sườn nướng và chả trứng", img: "/images/com_suon.jpg", category: "monchinh" },
    { id: 4, title: "Bún Bò Huế", price: 60000, desc: "Bún bò Huế nóng hổi đậm đà", img: "/images/bun_bo.jpg", category: "monchinh" },
    { id: 5, title: "Gỏi Cuốn Tôm Thịt", price: 45000, desc: "Gỏi cuốn tươi với tôm và thịt", img: "/images/goi_cuon.jpg", category: "monchinh" },
    { id: 6, title: "Cà Phê Sữa Đá", price: 25000, desc: "Cà phê sữa truyền thống Việt Nam", img: "/images/ca_phe_sua.jpg", category: "do_uong" },
    { id: 7, title: "Bánh Xèo", price: 50000, desc: "Bánh xèo vàng tươi thơm vị gạo", img: "/images/banh_xeo.jpg", category: "monchinh" },
    { id: 8, title: "Chè Ba Màu", price: 30000, desc: "Chè ba màu mát lạnh với nước cốt dừa", img: "/images/che_ba_mau.jpg", category: "trangmieng" },
];

function formatPrice(vnd) {
    return vnd.toLocaleString("vi-VN") + "đ";
}

function greetingByNow() {
    const h = new Date().getHours();
    if (h < 11) return "Chào buổi sáng Quý khách";
    if (h < 14) return "Chào buổi trưa Quý khách";
    if (h < 18) return "Chào buổi chiều Quý khách";
    return "Chào buổi tối Quý khách";
}

export default function Menu() {
    const [activeTab, setActiveTab] = useState("Tất cả");
    const [query, setQuery] = useState("");
    const [greeting, setGreeting] = useState(greetingByNow());
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const t = setInterval(() => setGreeting(greetingByNow()), 60000);
        return () => clearInterval(t);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return MENU_ITEMS.filter((it) => {
            const matchTab =
                activeTab === "Tất cả" ||
                (activeTab === "Món chính" && it.category === "monchinh") ||
                (activeTab === "Đồ uống" && it.category === "do_uong") ||
                (activeTab === "Tráng miệng" && it.category === "trangmieng") ||
                (activeTab === "Khuyến mãi" && it.category === "khuyenmai");

            const matchQuery =
                !q || it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);

            return matchTab && matchQuery;
        });
    }, [activeTab, query]);

    const addToCart = (item) => setCart((prev) => [...prev, item.id]);

    return (
        <div>
            {/* HEADER */}
            <div className="menu-header">
                <div className="menu-header__left">
                    <a href="/" className="menu-logo-link">
                        <img src="/images/LogoNhaHang.png" alt="Logo" className="menu-logo" />
                    </a>
                    <span className="menu-title">Nhà hàng Phương Nam</span>
                </div>
                <div className="menu-header__right">
                    <span className="menu-greeting"><i className="fa-solid fa-sun"></i> {greeting}</span>
                    <span className="menu-table">Bàn: C8</span>
                    <a href="/" className="menu-home-btn">
                        <i className="fa-solid fa-house"></i> Trang chủ
                    </a>
                    <span className="menu-icons">
            <i className="fa-solid fa-bell"></i>
            <i className="fa-solid fa-cart-shopping" title={`Giỏ: ${cart.length}`}></i>
            <i className="fa-solid fa-user"></i>
          </span>
                </div>
            </div>

            {/* SEARCH & TABS */}
            <div className="menu-toolbar">
                <input
                    type="text"
                    className="menu-search"
                    placeholder="Tìm món ăn, đồ uống..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="menu-tabs">
                    {TABS.map((t) => (
                        <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* MENU GRID */}
            <div className="menu-grid">
                {filtered.map((it) => (
                    <div className="menu-item" key={it.id}>
                        <img src={it.img} alt={it.title} />
                        <div className="menu-item-info">
                            <div className="menu-item-title">{it.title}</div>
                            <div className="menu-item-price">{formatPrice(it.price)}</div>
                            <div className="menu-item-desc">{it.desc}</div>
                            <button className="add-to-cart-btn" onClick={() => addToCart(it)}>Thêm vào giỏ</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
