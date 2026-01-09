import React from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import styles from "./popular-routes.module.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
import popular_route from "../../assets/popular_route.svg";
import calendar from "../../assets/calendar.svg";
import popular_route_image from "../../assets/popular_route_image.png";
import { useSearchTrip } from "../../contexts/SearchTripProvider";

const ASSETS = {
    bg: "https://www.figma.com/api/mcp/asset/6b3b101d-f898-4a78-9a8a-2b616f44d24f",
    routeImg: popular_route_image,
    calendarIcon:
        "https://www.figma.com/api/mcp/asset/67b6fbf5-f0c8-4863-b60d-d41a8474ccff",
};

// Định nghĩa các địa điểm với ID thực tế
const LOCATIONS = {
    THO_XUAN: { id: 23, name: "Thọ Xuân", type: "location" },
    GIAP_BAT: { id: 2, name: "Bến xe Giáp Bát", type: "location" },
    MY_DINH: { id: 3, name: "Bến xe Mỹ Đình", type: "location" },
};

// Các tuyến đường phổ biến
const getPopularRoutes = () => {
    const today = dayjs();
    const formattedDate = today.format("DD/MM/YYYY");

    return [
        {
            id: 1,
            title: "Thọ Xuân - Bến xe Giáp Bát",
            from: LOCATIONS.THO_XUAN,
            to: LOCATIONS.GIAP_BAT,
            date: formattedDate,
            departDate: today,
            img: ASSETS.routeImg,
        },
        {
            id: 2,
            title: "Thọ Xuân - Bến xe Mỹ Đình",
            from: LOCATIONS.THO_XUAN,
            to: LOCATIONS.MY_DINH,
            date: formattedDate,
            departDate: today,
            img: ASSETS.routeImg,
        },
        {
            id: 3,
            title: "Bến xe Giáp Bát - Thọ Xuân",
            from: LOCATIONS.GIAP_BAT,
            to: LOCATIONS.THO_XUAN,
            date: formattedDate,
            departDate: today,
            img: ASSETS.routeImg,
        },
        {
            id: 4,
            title: "Bến xe Mỹ Đình - Thọ Xuân",
            from: LOCATIONS.MY_DINH,
            to: LOCATIONS.THO_XUAN,
            date: formattedDate,
            departDate: today,
            img: ASSETS.routeImg,
        },
    ];
};

const PopularRoutes = () => {
    const navigate = useNavigate();
    const { setFrom, setTo, setDepartDate, setTripType, handleSearchTrip } =
        useSearchTrip();

    const popularRoutes = getPopularRoutes();

    const handleBookTicket = async (route) => {
        // Set search context
        setTripType("oneway");
        setFrom(route.from);
        setTo(route.to);
        setDepartDate(route.departDate);

        // Navigate to trip page với state để trigger auto search
        navigate("/trip", { state: { autoSearch: true } });
    };

    return (
        <div className={styles.container}>
            <MainLayout>
                <section className={styles.section}>
                    <div className={styles.bgWrap}>
                        <img src={ASSETS.bg} alt="" className={styles.bgImg} />
                    </div>

                    <div className={styles.headerRow}>
                        <div className={styles.icon}>
                            <img src={popular_route} alt="icon" />
                        </div>
                        <h2 className={styles.heading}>Tuyến xe phổ biến</h2>
                    </div>

                    <div className={styles.grid}>
                        {popularRoutes.map((r) => (
                            <article key={r.id} className={styles.card}>
                                <div className={styles.cardImage}>
                                    <img src={r.img} alt={r.title} />
                                </div>

                                <div className={styles.cardBody}>
                                    <h3 className={styles.cardTitle}>
                                        {r.title}
                                    </h3>

                                    <div className={styles.infoBox}>
                                        <div className={styles.infoLeft}>
                                            <div className={styles.iconSmall}>
                                                <img
                                                    src={calendar}
                                                    alt="calendar"
                                                />
                                            </div>
                                            <div>
                                                <div className={styles.label}>
                                                    Ngày đi
                                                </div>
                                                <div className={styles.date}>
                                                    {r.date}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.ctaWrap}>
                                            <button
                                                className={styles.btnPrimary}
                                                onClick={() =>
                                                    handleBookTicket(r)
                                                }
                                            >
                                                Đặt vé ngay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </MainLayout>
        </div>
    );
};

export default PopularRoutes;

