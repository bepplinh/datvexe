import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Banner from "../../components/Banner/Banner";
import Intro from "../../components/Intro/Intro";
import PopularRoutes from "./../../components/PopularRoute/PopularRoute";
import ServiceList from "../../components/ServiceList/ServiceList";
import Offices from "../../components/Offices/Offices";
import NewsSection from "../../components/NewsSection/NewsSection";
import SearchTrip from "../../components/SearchTrip/SearchTrip";
import { useSearchTrip } from "../../contexts/SearchTripProvider"

import "./HomePage.scss";

function HomePage() {
    const { handleSearchTrip, results } = useSearchTrip();
    const navigate = useNavigate();

    const onSubmit = async () => {
        const result = await handleSearchTrip();
        if (!result.success) {
            toast.warning(result.message);
            return;
        }
        console.log(result);
        navigate("/trip");
    }
    return (
        <>
            <div className="home-page__banner-search-wrapper">
                <Banner />
                <div className="home-page__search-trip-container">
                    <SearchTrip onSubmit={onSubmit} />
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
