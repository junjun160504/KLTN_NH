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
import PaymentcsPage from "./page/cus/PaymentCus";
import ChatbotcsPage from "./page/cus/ChatbotsCus";
import ReviewcsPage from "./page/cus/ReviewsCus";
import FoodReviewcsPage from "./page/cus/FoodReviewsCus";
import LoyaltycsPage from "./page/cus/LoyaltysCus";
import FoodDetailcsPage from "./page/cus/FoodDetailsCus";

// Import AdminLayout and ProtectedAdminRoute
import AdminLayout from "./layouts/AdminLayout";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

const routes = [
  // Login page (public - không cần protection)
  {
    path: "/main/login",
    element: <LoginPage />,
  },

  // Admin routes - Wrapped với ProtectedAdminRoute và AdminLayout
  {
    path: "/main/homes",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><Home /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/orders",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><OrderPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/categorys",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><MenuPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/tables",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><TablePage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/customers",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><CustomerPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/staffs",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><StaffPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/reports/sales",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><ReportsSalesPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/reports/products",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><ReportsProductsPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/reports/customers",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><ReportsCustomersPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/main/reports/chatbots",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout><ReportsChatbotPage /></AdminLayout>
      </ProtectedAdminRoute>
    ),
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
    path: "/cus/payment",
    element: <PaymentcsPage />,
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
