import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";
import SocialSide from "../components/SocialSide/SocialSide";
import "./ClientLayout.scss";

function ClientLayout() {
    return (
        <>
            <Header />

            <main>
                <Outlet />
            </main>

            <Footer />

            <div className="sticky-bottom-right">
                <SocialSide />
            </div>
        </>
    );
}

export default ClientLayout;
