import "./TripCard.scss";

const TripCard = ({ trip, onClick }) => {
    if (!trip) return null;

    const formatPrice = (price) => {
        if (!price) return "0đ";
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const getBusInitials = (busName) => {
        if (!busName) return "NS";
        const words = busName.split(" ");
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return busName.substring(0, 2).toUpperCase();
    };

    const calculateSeatPercentage = () => {
        const total = trip.total_seats || 0;
        const available = trip.available_seats || 0;
        if (total === 0) return 0;
        const percent = ((total - available) / total) * 100;
        return Math.max(0, Math.min(100, Math.round(percent)));
    };

    return (
        <div className="chatbot-trip-card" onClick={() => onClick?.(trip)}>
            <div className="chatbot-trip-card__header">
                <div className="chatbot-trip-card__avatar">
                    {getBusInitials(trip.bus?.name)}
                </div>
                <div className="chatbot-trip-card__info">
                    <h4 className="chatbot-trip-card__bus-name">
                        {trip.bus?.name || "N/A"}
                    </h4>
                    <span className="chatbot-trip-card__bus-type">
                        {trip.bus?.type || trip.route_name || "N/A"}
                    </span>
                </div>
                <div className="chatbot-trip-card__price">
                    {formatPrice(trip.price)}
                </div>
            </div>

            <div className="chatbot-trip-card__route">
                <div className="chatbot-trip-card__time">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M12 7v5l3 2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span>{trip.departure_time || "N/A"}</span>
                </div>
                <div className="chatbot-trip-card__duration">
                    {trip.duration_text || "N/A"}
                </div>
                <div className="chatbot-trip-card__time">
                    <span>{trip.arrival_time || "N/A"}</span>
                </div>
            </div>

            {(trip.from_location || trip.to_location) && (
                <div className="chatbot-trip-card__locations">
                    <span className="chatbot-trip-card__from">
                        {trip.from_location || "N/A"}
                    </span>
                    <span className="chatbot-trip-card__arrow">→</span>
                    <span className="chatbot-trip-card__to">
                        {trip.to_location || "N/A"}
                    </span>
                </div>
            )}

            <div className="chatbot-trip-card__footer">
                <div className="chatbot-trip-card__seats">
                    <span>
                        Còn <strong>{trip.available_seats || 0}</strong>/
                        {trip.total_seats || 0} chỗ
                    </span>
                    <div className="chatbot-trip-card__seat-bar">
                        <div
                            className="chatbot-trip-card__seat-fill"
                            style={{
                                width: `${calculateSeatPercentage()}%`,
                            }}
                        />
                    </div>
                </div>
                <button className="chatbot-trip-card__button">
                    Đặt vé
                </button>
            </div>
        </div>
    );
};

export default TripCard;

