import { BrowserRouter, Routes, Route } from "react-router-dom";
import routes from "./routes";
import AppTheme from "./components/AppTheme"; // thêm dòng này

function App() {
  return (
    <AppTheme>
      <BrowserRouter>
        <Routes>
          {routes.map((r, i) => (
            <Route key={i} path={r.path} element={r.element} />
          ))}
        </Routes>
      </BrowserRouter>
    </AppTheme>
  );
}

export default App;