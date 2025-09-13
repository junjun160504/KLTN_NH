import LoginPage from "./page/management/auth/Login";
import Home from "./page/management/Main/Homes";
import OrderPage from "./page/management/Main/Order";
import MenuPage from "./page/management/Main/Category";
import CustomerPage from "./page/management/Main/Customers";
const routes = [
  {
    path: "/management/auth",
    element: <LoginPage />,
  },
  {
    path: "/main/home",
    element: <Home />,
  },
  {
    path: "/main/order",
    element: <OrderPage />,
  },
  { 
    path: "/main/category",
    element: <MenuPage />,
  },
  {
    path: "/main/customer",
    element: <CustomerPage />,
  }
];

export default routes;
