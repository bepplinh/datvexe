import { toast } from "react-toastify";
import Banner from "../../components/Banner/Banner";
import Intro from "../../components/Intro/Intro";
import PopularRoutes from "./../../components/PopularRoute/PopularRoute";
import ServiceList from "../../components/ServiceList/ServiceList";
import Offices from "../../components/Offices/Offices";
import NewsSection from "../../components/NewsSection/NewsSection";
import SearchTrip from "../../components/SearchTrip/SearchTrip";

import "./HomePage.scss";

function HomePage() {
    return (
        <>
            <div className="home-page__banner-search-wrapper">
                <Banner />
                <div className="home-page__search-trip-container">
                    <SearchTrip />
                </div>
            </div>
            <Intro />
            <PopularRoutes />
            <ServiceList />
            <Offices />
            <NewsSection />
        </>
    );
}

export default HomePage;
