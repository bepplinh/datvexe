import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ClientLayout from "./layout/ClientLayout";
import HomePage from "./pages/HomePage/HomePage";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Profile from "./pages/Profile/Profile";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AdminLayout from "./layout/AdminLayout";
import RequireAdmin from "./router/RequireAdmin";
import Trip from "./pages/Trip/Trip";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<ClientLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/trip" element={<Trip />} />
                </Route>

                <Route
                    element={
                        <RequireAdmin>
                            <AdminLayout />
                        </RequireAdmin>
                    }
                >
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
