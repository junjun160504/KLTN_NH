import { BrowserRouter, Routes, Route } from "react-router-dom";
import routes from "./routes";
import AppTheme from "./components/AppTheme";
import CustomerMenuPage from "./page/cus/MenusCus";
import FoodDetailPage from "./page/cus/FoodDetailsCus";


function App() {
  return (
    <AppTheme>
      <BrowserRouter>
        <Routes>
          {/* Map các route đã định nghĩa sẵn */}
          {routes.map((r, i) => (
            <Route key={i} path={r.path} element={r.element} />
          ))}

          {/* Các route tĩnh bạn muốn thêm */}
          <Route path="/" element={<CustomerMenuPage />} />
          <Route path="/food/:id" element={<FoodDetailPage />} />
        </Routes>
      </BrowserRouter>
    </AppTheme>
  );
}

export default App;
