import LoginPage from "./page/management/auth/Login";
import Home from "./page/management/Main/Homes";
import OrderPage from "./page/management/Main/Orders";
import MenuPage from "./page/management/Main/Categorys";
import CustomerPage from "./page/management/Main/Customers";
import StaffPage from "./page/management/Main/Staffs";
import ReportPage from "./page/management/Main/Reports";

import HomecsPage from "./page/cus/HomesCus";
import MenucsPage from "./page/cus/MenusCus";
import CartcsPage from "./page/cus/CartsCus";
import BillcsPage from "./page/cus/BillsCus";
import ChatbotcsPage from "./page/cus/ChatbotsCus";
import ReviewcsPage from "./page/cus/ReviewsCus";
import FoodReviewcsPage from "./page/cus/FoodReviewsCus";
import LoyaltycsPage from "./page/cus/LoyaltysCus";
import FoodDetailcsPage from "./page/cus/FoodDetailsCus"; 
const routes = [
  {
    path: "/main/auth",
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
    path: "/main/reports",
    element: <ReportPage />,
  },
  {
    path: "/cus/homes",
    element: <HomecsPage />,
  },
  {
    path: "/cus/menus",
    element: <MenucsPage />,
  },
  {
    path: "/cus/carts",
    element: <CartcsPage />,
  },
  {
    path: "/cus/bills",
    element: <BillcsPage />,
  },
  {
    path: "/cus/chatbot",
    element: <ChatbotcsPage />,
  },
  {
    path: "/cus/reviews",
    element: <ReviewcsPage />,
  },
  {
    path: "/cus/foodreviews",
    element: <FoodReviewcsPage />,
  },
  {
    path: "/cus/loyaltys",
    element: <LoyaltycsPage />,
  },
  {
    path: "/cus/fooddetails/:id",
    element: <FoodDetailcsPage />,
  }

];

export default routes;
