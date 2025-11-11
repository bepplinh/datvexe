import React from "react";
import styles from "./popular-routes.module.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
import popular_route from "../../assets/popular_route.svg";
import calendar from "../../assets/calendar.svg";

const ASSETS = {
    bg: "https://www.figma.com/api/mcp/asset/6b3b101d-f898-4a78-9a8a-2b616f44d24f",
    routeImg:
        "https://www.figma.com/api/mcp/asset/65573aa0-0de8-4cf2-96da-3e4c54caf706",
    calendarIcon:
        "https://www.figma.com/api/mcp/asset/67b6fbf5-f0c8-4863-b60d-d41a8474ccff",
};

const sampleRoutes = [
    {
        id: 1,
        title: "Thọ Xuân - Bến xe Giáp Bát",
        date: "11/08/2025",
        img: ASSETS.routeImg,
    },
    {
        id: 2,
        title: "Thọ Xuân - Bến Xe Mỹ Đình",
        date: "11/08/2025",
        img: ASSETS.routeImg,
    },
    {
        id: 3,
        title: "Bến xe Giáp Bát - Thọ Xuân",
        date: "11/08/2025",
        img: ASSETS.routeImg,
    },
    {
        id: 4,
        title: "Bến xe Mỹ Đình - Thọ Xuân",
        date: "11/08/2025",
        img: ASSETS.routeImg,
    },
];

const PopularRoutes = () => {
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
                    {sampleRoutes.map((r) => (
                        <article key={r.id} className={styles.card}>
                            <div className={styles.cardImage}>
                                <img src={r.img} alt={r.title} />
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.cardTitle}>{r.title}</h3>

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
                                        <button className={styles.btnPrimary}>
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
