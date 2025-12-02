import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLayout from "./layout/ClientLayout";
import AdminLayout from "./layout/AdminLayout";
import RequireAdmin from "./router/RequireAdmin";
import { AdminNotificationProvider } from "./contexts/AdminNotificationProvider";
import AdminLogin from "./pages/AdminLogin/AdminLogin";
import { AdminAuthProvider } from "./contexts/AdminAuthProvider";
import { ADMIN_ROUTES, CLIENT_ROUTES } from "./router/routesConfig.jsx";

const renderRoutes = (routes) =>
    routes.map(({ path, element }) => <Route key={path} path={path} element={element} />);

const adminProtectedLayout = (
    <AdminAuthProvider>
        <RequireAdmin>
            <AdminNotificationProvider>
                <AdminLayout />
            </AdminNotificationProvider>
        </RequireAdmin>
    </AdminAuthProvider>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<ClientLayout />}>{renderRoutes(CLIENT_ROUTES)}</Route>

                <Route
                    path="/admin/login"
                    element={
                        <AdminAuthProvider>
                            <AdminLogin />
                        </AdminAuthProvider>
                    }
                />
                <Route element={adminProtectedLayout}>{renderRoutes(ADMIN_ROUTES)}</Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
