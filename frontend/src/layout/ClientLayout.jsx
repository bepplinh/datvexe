import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";
import ChatBot from "../components/ChatBot/ChatBot";
import ClientChatWidget from "../components/ClientChatWidget/ClientChatWidget";
import RatingPrompt from "../components/RatingPrompt/RatingPrompt";
import "./ClientLayout.scss";
import TopBanner from "../components/TopBanner/TopBanner";
import { UserNotificationProvider } from "../contexts/UserNotificationProvider";

function ClientLayout() {
    return (
        <UserNotificationProvider>
            <TopBanner />
            <Header />

            <main>
                <Outlet />
            </main>

            <Footer />
            <RatingPrompt />
            {/* Chat bot gợi ý chuyến xe (AI) */}
            <ChatBot />
            {/* Chat trực tiếp với admin */}
            <ClientChatWidget />
        </UserNotificationProvider>
    );
}

export default ClientLayout;

