import HomePage from "../pages/HomePage/HomePage";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Profile from "../pages/Profile/Profile";
import TicketManagement from "../pages/TicketManagement/TicketManagement";
import Trip from "../pages/Trip/Trip";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import BookSeat from "../components/BookSeat/BookSeat";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import User from "../pages/AdminDashboard/User/User";
import Location from "../pages/AdminDashboard/Location/Location";
import AdminRoutePage from "../pages/AdminDashboard/Route/Route";
import SeatLayoutBuilder from "../pages/AdminDashboard/SeatLayoutBuilder/SeatLayoutBuilder";
import RouteOptimizationPage from "../pages/AdminDashboard/RouteOptimization/RouteOptimization";
import Notifications from "../pages/AdminDashboard/Notifications/Notifications";
import BusType from "../pages/AdminDashboard/BusType/BusType";
import BusManagement from "../pages/AdminDashboard/BusManagement/BusManagement";
import TripManagement from "../pages/AdminDashboard/TripManagement/TripManagement";
import TripRouteDetail from "../pages/AdminDashboard/TripManagement/TripRouteDetail";
import { CheckoutProvider } from "../contexts/CheckoutProvider";
import Test from "../pages/test";

export const CLIENT_ROUTES = [
    { path: "/", element: <HomePage /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/profile", element: <Profile /> },
    { path: "/tickets", element: <TicketManagement /> },
    { path: "/trip", element: <Trip /> },
    {
        path: "/checkout",
        element: (
            <CheckoutProvider>
                <CheckoutPage />
            </CheckoutProvider>
        ),
    },
    { path: "/book", element: <BookSeat /> },
    {path: "/test", element: <Test />}
];

export const ADMIN_ROUTES = [
    { path: "/admin", element: <AdminDashboard /> },
    { path: "/admin/users", element: <User /> },
    { path: "/admin/locations", element: <Location /> },
    { path: "/admin/routes", element: <AdminRoutePage /> },
    { path: "/admin/buses", element: <BusManagement /> },
    { path: "/admin/bus-types", element: <BusType /> },
    { path: "/admin/trips", element: <TripManagement /> },
    { path: "/admin/trips/:date/:routeId", element: <TripRouteDetail /> },
    { path: "/admin/seat-layout", element: <SeatLayoutBuilder /> },
    { path: "/admin/route-optimization", element: <RouteOptimizationPage /> },
    { path: "/admin/notifications", element: <Notifications /> },
];

