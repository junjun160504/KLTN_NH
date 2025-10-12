import LoginPage from "./page/management/auth/Login";
import Home from "./page/management/Main/Homes";
import OrderPage from "./page/management/Main/Orders";
import MenuPage from "./page/management/Main/Categorys";
import TablePage from "./page/management/Main/Tables";
import CustomerPage from "./page/management/Main/Customers";
import StaffPage from "./page/management/Main/Staffs";
import ReportsSalesPage from "./page/management/Main/ReportsSales";
import ReportsProductsPage from "./page/management/Main/ReportsProducts";
import ReportsCustomersPage from "./page/management/Main/ReportsCustomers";
import ReportsChatbotPage from "./page/management/Main/ReportsChatbots";

import HomecsPage from "./page/cus/HomesCus";
import MenucsPage from "./page/cus/MenusCus";
import CartcsPage from "./page/cus/CartsCus";
import BillcsPage from "./page/cus/BillsCus";
import ChatbotcsPage from "./page/cus/ChatbotsCus";
import ReviewcsPage from "./page/cus/ReviewsCus";
import FoodReviewcsPage from "./page/cus/FoodReviewsCus";
import LoyaltycsPage from "./page/cus/LoyaltysCus";
import FoodDetailcsPage from "./page/cus/FoodDetailsCus";

// Import AdminLayout
import AdminLayout from "./layouts/AdminLayout";

const routes = [
  // Login page (không cần notifications)
  {
    path: "/main/auth",
    element: <LoginPage />,
  },

  // Admin routes - Tất cả wrapped trong AdminLayout
  // Dùng path tuyệt đối thay vì nested routes
  {
    path: "/main/homes",
    element: <AdminLayout><Home /></AdminLayout>,
  },
  {
    path: "/main/orders",
    element: <AdminLayout><OrderPage /></AdminLayout>,
  },
  {
    path: "/main/categorys",
    element: <AdminLayout><MenuPage /></AdminLayout>,
  },
  {
    path: "/main/tables",
    element: <AdminLayout><TablePage /></AdminLayout>,
  },
  {
    path: "/main/customers",
    element: <AdminLayout><CustomerPage /></AdminLayout>,
  },
  {
    path: "/main/staffs",
    element: <AdminLayout><StaffPage /></AdminLayout>,
  },
  {
    path: "/main/reports/sales",
    element: <AdminLayout><ReportsSalesPage /></AdminLayout>,
  },
  {
    path: "/main/reports/products",
    element: <AdminLayout><ReportsProductsPage /></AdminLayout>,
  },
  {
    path: "/main/reports/customers",
    element: <AdminLayout><ReportsCustomersPage /></AdminLayout>,
  },
  {
    path: "/main/reports/chatbots",
    element: <AdminLayout><ReportsChatbotPage /></AdminLayout>,
  },

  // Customer routes (không cần AdminLayout)
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
