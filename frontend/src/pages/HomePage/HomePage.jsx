import { toast } from "react-toastify";
import Banner from "../../components/Banner/Banner";
import Intro from "../../components/Intro/Intro";
import PopularRoutes from "./../../components/PopularRoute/PopularRoute";
import ServiceList from "../../components/ServiceList/ServiceList";
import Offices from "../../components/Offices/Offices";
import NewsSection from "../../components/NewsSection/NewsSection";

function HomePage() {
    return (
        <>
            <Banner />
            <Intro />
            <PopularRoutes />
            {/* <ServiceList /> */}
            <Offices />
            <NewsSection />
        </>
    );
}

export default HomePage;
