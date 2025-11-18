import { Star, Clock } from "lucide-react";
import "./BusInfo.scss";

export default function BusInfo({ trip, selectedSeats = [] }) {
  if (!trip) return null;

  const formatPrice = (price) => {
    if (!price) return "0đ";
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const busName = trip.bus?.name || "N/A";
  const busType = trip.bus?.type || trip.route_name || "N/A";
  const routeText = `${trip.from_location || "N/A"} - ${trip.to_location || "N/A"}`;
  const departure = trip.departure_time || "N/A";
  const arrival = trip.arrival_time || "N/A";
  const duration = trip.duration_text || "N/A";

  const seatPrice = trip.price || 0;
  const totalPrice = seatPrice * selectedSeats.length;

  return (
    <div className="bus-info">
      <div className="bus-info__header">
        <h2 className="bus-info__title">{busName}</h2>
        <span className="bus-info__rating">4.5/5</span>
      </div>

      <div className="bus-info__type">
        <span>{busType}</span>
      </div>

      <h3 className="bus-info__route">{routeText}</h3>

      <div className="bus-info__time-section">
        <div className="bus-info__time">{departure}</div>
        <div className="bus-info__duration">
          <Clock />
          <span>{duration}</span>
        </div>
        <div className="bus-info__time">{arrival}</div>
      </div>

      <div className="bus-info__services">
        <div className="bus-info__services-title">
          <Star />
          <h4>Dịch vụ kèm theo</h4>
        </div>
        <ul className="bus-info__services-list">
          <li>
            <span></span>
            <span>Đón trả tận nơi</span>
          </li>
          <li>
            <span></span>
            <span>Wifi</span>
          </li>
          <li>
            <span></span>
            <span>Khăn ướt</span>
          </li>
          <li>
            <span></span>
            <span>Ghế matxa</span>
          </li>
        </ul>
      </div>

      {selectedSeats.length > 0 && (
        <div className="bus-info__price-summary">
          <div className="bus-info__price-title">Giá vé:</div>
          <ul className="bus-info__price-list">
            {selectedSeats.map((seat) => (
              <li key={seat} className="bus-info__price-item">
                <span className="bus-info__price-seat">{seat}</span>
                <span className="bus-info__price-value">
                  {formatPrice(seatPrice)}
                </span>
              </li>
            ))}
          </ul>
          <div className="bus-info__price-total">
            <span>Tổng tiền</span>
            <span className="bus-info__price-total-value">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}