import React, { useState } from "react";
import "./TripFilter.scss";

function TripFilter() {
  const [giuongNam, setGiuongNam] = useState(false);
  const [limousineCabin, setLimousineCabin] = useState(false);
  const [timeMin, setTimeMin] = useState(0);
  const [seatMin, setSeatMin] = useState(0);

  const formatTime = (m) => {
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const reset = () => {
    setGiuongNam(false);
    setLimousineCabin(false);
    setTimeMin(0);
    setSeatMin(0);
  };

  return (
    <div className="trip-filter">
      <div className="trip-filter__header">
        <svg className="trip-filter__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 18v-5l-6-7V4h16v2l-6 7v5l-4-2z" fill="#0c1e51"/>
        </svg>
        <div className="trip-filter__title">BỘ LỌC</div>
        <button type="button" className="trip-filter__clear" onClick={reset}>Xóa bộ lọc</button>
      </div>

      <div className="trip-filter__section">
        <div className="trip-filter__section-title">Loại xe</div>
        <label className="trip-filter__checkbox">
          <input type="checkbox" checked={giuongNam} onChange={(e) => setGiuongNam(e.target.checked)} />
          <span>GIƯỜNG NẰM</span>
        </label>
        <label className="trip-filter__checkbox">
          <input type="checkbox" checked={limousineCabin} onChange={(e) => setLimousineCabin(e.target.checked)} />
          <span>LIMOUSINE-CABIN</span>
        </label>
      </div>

      <div className="trip-filter__section">
        <div className="trip-filter__section-title">Giờ chạy</div>
        <div className="trip-filter__range">
          <input
            type="range"
            min="0"
            max="1439"
            value={timeMin}
            onChange={(e) => setTimeMin(Number(e.target.value))}
          />
        </div>
        <div className="trip-filter__range-labels">
          <span className="trip-filter__label-left">00:00</span>
          <span className="trip-filter__label-right">23:59</span>
        </div>
      </div>

      <div className="trip-filter__section">
        <div className="trip-filter__section-title">Lượng ghế trống</div>
        <div className="trip-filter__range">
          <input
            type="range"
            min="0"
            max="60"
            value={seatMin}
            onChange={(e) => setSeatMin(Number(e.target.value))}
          />
        </div>
        <div className="trip-filter__range-labels">
          <span className="trip-filter__label-left">0</span>
          <span className="trip-filter__label-right">60</span>
        </div>
      </div>
    </div>
  );
}

export default TripFilter;

