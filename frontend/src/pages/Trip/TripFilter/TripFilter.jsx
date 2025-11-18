import React from "react";
import "./TripFilter.scss";
import { useTripFilter } from "../../../contexts/TripFilterProvider";

function TripFilter() {
  const {
    giuongNam,
    setGiuongNam,
    limousineCabin,
    setLimousineCabin,
    timeMin,
    setTimeMin,
    timeMax,
    setTimeMax,
    seatMin,
    setSeatMin,
    seatMax,
    setSeatMax,
    reset,
  } = useTripFilter();

  const formatTime = (m) => {
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
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
          <div className="trip-filter__range-track" />
          <div
            className="trip-filter__range-fill"
            style={{
              left: `${(timeMin / 1439) * 100}%`,
              width: `${((timeMax - timeMin) / 1439) * 100}%`,
            }}
          />
          <input
            className="trip-filter__range-input"
            type="range"
            min="0"
            max="1439"
            value={timeMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTimeMin(Math.min(v, timeMax));
            }}
          />
          <input
            className="trip-filter__range-input"
            type="range"
            min="0"
            max="1439"
            value={timeMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTimeMax(Math.max(v, timeMin));
            }}
          />
        </div>
        <div className="trip-filter__range-labels">
          <span className="trip-filter__label-left">{formatTime(timeMin)}</span>
          <span className="trip-filter__label-right">{formatTime(timeMax)}</span>
        </div>
      </div>

      <div className="trip-filter__section">
        <div className="trip-filter__section-title">Lượng ghế trống</div>
        <div className="trip-filter__range">
          <div className="trip-filter__range-track" />
          <div
            className="trip-filter__range-fill"
            style={{
              left: `${(seatMin / 60) * 100}%`,
              width: `${((seatMax - seatMin) / 60) * 100}%`,
            }}
          />
          <input
            className="trip-filter__range-input"
            type="range"
            min="0"
            max="60"
            value={seatMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSeatMin(Math.min(v, seatMax));
            }}
          />
          <input
            className="trip-filter__range-input"
            type="range"
            min="0"
            max="60"
            value={seatMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSeatMax(Math.max(v, seatMin));
            }}
          />
        </div>
        <div className="trip-filter__range-labels">
          <span className="trip-filter__label-left">{seatMin}</span>
          <span className="trip-filter__label-right">{seatMax}</span>
        </div>
      </div>
    </div>
  );
}

export default TripFilter;
