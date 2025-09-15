import LoginPage from "./page/management/auth/Login";
import Home from "./page/management/Main/Homes";
import OrderPage from "./page/management/Main/Orders";
import MenuPage from "./page/management/Main/Categorys";
import CustomerPage from "./page/management/Main/Customers";
import StaffPage from "./page/management/Main/Staffs";
import HomecsPage from "./page/cus/HomesCus";
const routes = [
  {
    path: "/management/auth",
    element: <LoginPage />,
  },
  {
    path: "/main/homes",
    element: <Home />,
  },
  {
    path: "/main/orders",
    element: <OrderPage />,
  },
  { 
    path: "/main/categorys",
    element: <MenuPage />,
  },
  {
    path: "/main/customers",
    element: <CustomerPage />,
  },
  {
    path: "/main/staffs",
    element: <StaffPage />,
  },
  {
    path: "/cus/homes",
    element: <HomecsPage />,
  }
];

export default routes;
