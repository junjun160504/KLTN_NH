import { BrowserRouter, Routes, Route } from "react-router-dom";
import routes from "./routes";
import AppTheme from "./components/AppTheme";
import { SessionProvider } from "./contexts/SessionContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ToastNotification from "./components/ToastNotification";
import CustomerMenuPage from "./page/cus/MenusCus";
import FoodDetailPage from "./page/cus/FoodDetailsCus";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "./redux/slices/cartSlice";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const savedOrder = sessionStorage.getItem("order");
    if (savedOrder) {
      dispatch(addToCart(JSON.parse(savedOrder)));
    }
  }, [dispatch]);

  return (
    <AppTheme>
      <NotificationProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              {/* Map các route đã định nghĩa sẵn */}
              {routes.map((r, i) => (
                <Route key={i} path={r.path} element={r.element} />
              ))}

              {/* Các route tĩnh bạn muốn thêm */}
              <Route path="/" element={<CustomerMenuPage />} />
              <Route path="/menu" element={<CustomerMenuPage />} />
              <Route path="/food/:id" element={<FoodDetailPage />} />
            </Routes>

            {/* Toast notifications - hiển thị ở tất cả các trang */}
            <ToastNotification />
          </BrowserRouter>
        </SessionProvider>
      </NotificationProvider>
    </AppTheme>
  );
}

export default App;
