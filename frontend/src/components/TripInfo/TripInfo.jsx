import React from "react";
import "./TripInfo.scss";

export default function TripInfo({ trips = [] }) {
  if (!trips || trips.length === 0) {
    return (
      <div>
        <p>Không có chuyến xe nào</p>
      </div>
    );
  }

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

  return (
    <div>
      {trips.map((t, i) => (
        <div className="overlay" key={t.trip_id || i}>
          <div className="vector">{getBusInitials(t.bus?.name)}</div>
          <div className="container">
            <div className="heading4">
              <p className="xeNgCsn">{t.bus?.name || "N/A"}&nbsp;</p>
              <div className="background">
                <p className="a455">4.5/5*</p>
              </div>
            </div>
            <div className="backgroundBorder">
              <p className="xe22PhNgVip">{t.bus?.type || t.route_name || "N/A"}</p>
            </div>
            <div className="heading6">
              <svg className="icClockSvg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#2d2d2f" strokeWidth="1.5" />
                <path d="M12 7v5l3 2" fill="none" stroke="#2d2d2f" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="khIhNh0230">Khởi hành {t.departure_time || "N/A"}</p>
            </div>
            <p className="aGiKhIhNhTNhTThXuN">* Giờ khởi hành tính từ {t.from_location || "N/A"}</p>
          </div>
          <div className="container4">
            <p className="a0230">{t.departure_time || "N/A"}</p>
            <div className="container3">
              <div className="container2">
                <p className="a2H45M">{t.duration_text || "N/A"}</p>
              </div>
              <div className="horizontalDivider" />
            </div>
            <p className="a0515">{t.arrival_time || "N/A"}</p>
          </div>
          <div className="verticalDivider" />
          <div className="verticalDivider2" />
          <div className="container5">
            <p className="a180000">{formatPrice(t.price)}</p>
            <div className="button">
              <p className="aTv">Đặt vé</p>
            </div>
          </div>
          <div className="container6">
            <p className="cN2222Ch3">
              <span className="cN2222Ch">Còn&nbsp;</span>
              <span className="cN2222Ch2">{t.available_seats || 0}</span>
              <span className="cN2222Ch">/{t.total_seats || 0} chỗ</span>
            </p>
            <div className="background2">
              <div
                className="backgroundFill"
                style={{
                  width: `${Math.max(0, Math.min(100, Math.round(((t.total_seats - t.available_seats) / t.total_seats) * 100)))}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
