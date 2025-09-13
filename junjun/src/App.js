import { BrowserRouter, Routes, Route } from "react-router-dom";
import routes from "./routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((r, i) => (
          <Route key={i} path={r.path} element={r.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
