import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLayout from "./layout/ClientLayout";
import HomePage from "./pages/HomePage/HomePage";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Profile from "./pages/Profile/Profile";
import AdminLayout from "./layout/AdminLayout";
import RequireAdmin from "./router/RequireAdmin";
import Trip from "./pages/Trip/Trip";
import CheckoutPage from "./pages/Checkout/CheckoutPage";
import BookSeat from "./components/BookSeat/BookSeat";
import TicketManagement from "./pages/TicketManagement/TicketManagement";
import { CheckoutProvider } from "./contexts/CheckoutProvider";

import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AdminLogin from "./pages/AdminLogin/AdminLogin";
import { AdminAuthProvider } from "./contexts/AdminAuthProvider";
import User from "./pages/AdminDashboard/User/User";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<ClientLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/tickets" element={<TicketManagement />} />
                    <Route path="/trip" element={<Trip />} />
                    <Route
                        path="/checkout"
                        element={
                            <CheckoutProvider>
                                <CheckoutPage />
                            </CheckoutProvider>
                        }
                    />
                    <Route path="/book" element={<BookSeat />} />
                </Route>

                {/* <Route
                    element={
                        <RequireAdmin>
                            <AdminLayout />
                        </RequireAdmin>
                    }
                >
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route> */}

                <Route
                    path="/admin/login"
                    element={
                        <AdminAuthProvider>
                            <AdminLogin />
                        </AdminAuthProvider>
                    }
                />
                <Route
                    element={
                        <AdminAuthProvider>
                            <AdminLayout />
                        </AdminAuthProvider>
                    }
                >
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<User />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
