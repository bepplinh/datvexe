import React from "react";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import TripCard from "./TripCard";
import "./TripList.scss";

const TripList = ({
    trips,
    loading,
    selectedRouteId,
    selectedDate,
    onTripClick,
    selectedTripId,
}) => {
    if (!selectedRouteId || !selectedDate) {
        return (
            <div className="trip-list trip-list--empty">
                <p>Vui lòng chọn tuyến và ngày để xem danh sách chuyến</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="trip-list trip-list--loading">
                <CircularIndeterminate />
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="trip-list trip-list--empty">
                <p>Không có chuyến nào trong ngày đã chọn</p>
            </div>
        );
    }

    return (
        <div className="trip-list">
            <div className="trip-list__header">
                <h2 className="trip-list__title">
                    Danh sách chuyến ({trips.length})
                </h2>
            </div>
            <div className="trip-list__grid">
                {trips.map((trip) => (
                    <TripCard
                        key={trip.id}
                        trip={trip}
                        onClick={onTripClick}
                        isSelected={selectedTripId === trip.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default TripList;

