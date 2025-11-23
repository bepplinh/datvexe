import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";
import SocialSide from "../components/SocialSide/SocialSide";
import ChatBot from "../components/ChatBot/ChatBot";
import "./ClientLayout.scss";
import TopBanner from "../components/TopBanner/TopBanner";

function ClientLayout() {
    return (
        <>
            <TopBanner />
            <Header />

            <main>
                <Outlet />
            </main>

            <Footer />

            <div className="sticky-bottom-right">
                <SocialSide />
            </div>
            <ChatBot />
        </>
    );
}

export default ClientLayout;
