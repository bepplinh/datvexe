import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";
import ChatBot from "../components/ChatBot/ChatBot";
import ClientChatWidget from "../components/ClientChatWidget/ClientChatWidget";
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
            {/* Chat bot gợi ý chuyến xe (AI) */}
            <ChatBot />
            {/* Chat trực tiếp với admin */}
            <ClientChatWidget />
        </>
    );
}

export default ClientLayout;
