import React, { useMemo, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "./TripQuickDates.scss";

const TripQuickDates = ({ selectedDate, onSelectDate }) => {
    const listRef = useRef(null);

    const days = useMemo(() => {
        const today = dayjs();
        return Array.from({ length: 7 }, (_, index) => {
            const date = today.add(index, "day");
            return {
                key: date.format("YYYY-MM-DD"),
                date,
                label: date.locale("vi").format("dddd, DD/MM/YYYY"),
            };
        });
    }, []);

    const isSameDay = (a, b) => {
        if (!a || !b) return false;
        return dayjs(a).isSame(b, "day");
    };

    const handleScroll = (direction) => {
        if (!listRef.current) return;
        const scrollDistance = direction === "next" ? 220 : -220;
        listRef.current.scrollBy({ left: scrollDistance, behavior: "smooth" });
    };

    return (
        <div className="trip-quick-dates">
            <div className="trip-quick-dates__overlay">
                <button
                    type="button"
                    className="trip-quick-dates__arrow trip-quick-dates__arrow--prev"
                    onClick={() => handleScroll("prev")}
                >
                    <span aria-hidden="true">‹</span>
                </button>

                <div className="trip-quick-dates__list" ref={listRef}>
                    {days.map((item) => {
                        const active = isSameDay(selectedDate, item.date);

                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={
                                    "trip-quick-dates__item" +
                                    (active
                                        ? " trip-quick-dates__item--active"
                                        : "")
                                }
                                onClick={() => onSelectDate(item.date)}
                            >
                                <span className="trip-quick-dates__text">
                                    {item.label}
                                </span>
                                <span className="trip-quick-dates__indicator" />
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="trip-quick-dates__arrow trip-quick-dates__arrow--next"
                    onClick={() => handleScroll("next")}
                >
                    <span aria-hidden="true">›</span>
                </button>
            </div>
        </div>
    );
};

export default TripQuickDates;



