import React from "react";
import styles from "./TripDate.module.scss";

export default function TripDate({ title, subtitle, arrow = "right", dim = false }) {
    return (
        <div className={styles.container}>
            <div className={`${styles.background} ${dim ? styles.dim : ""}`}>
                <div className={`${styles.iconWrap} ${arrow === "left" ? styles.left : ""}`}>
                    <svg
                        className={styles.iconSvg}
                        viewBox="0 0 26 27"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M9 6l8 7-8 7"
                            fill="none"
                            stroke="#555555"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div className={styles.textBox}>
                    <p className={styles.title}>{title}</p>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>
            </div>
        </div>
    );
}

