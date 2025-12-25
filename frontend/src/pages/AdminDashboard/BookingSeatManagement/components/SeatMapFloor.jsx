import React from "react";
import { hasCustomPosition, getCanvasStyle, groupSeatsByDeck } from "./seatMapUtils";
import SeatButton from "./SeatButton";
import "./SeatMap.scss";

const SeatMapFloor = ({
    deckKey,
    deckSeats,
    layout,
    isSeatSelected,
    highlightedSeats = [],
    onSeatClick,
}) => {
    const deckNumber =
        Number(deckKey.replace("deck_", "")) || deckKey;
    const hasCustom = deckSeats.some((seat) => hasCustomPosition(seat));

    return (
        <div className="seat-map__floor">
            <h4 className="seat-map__floor-title">Tầng {deckNumber}</h4>
            <div className="seat-map__floor-seats">
                {hasCustom ? (
                    <div
                        className="seat-map__floor-canvas"
                        style={getCanvasStyle(deckSeats, layout)}
                    >
                        {deckSeats.map((seat) => {
                            const selected = isSeatSelected(seat.label);
                            return (
                                <div
                                    className="seat-map__seat-floating"
                                    key={seat.label}
                                    style={{
                                        left: seat.position?.x || 0,
                                        top: seat.position?.y || 0,
                                        position: "absolute",
                                    }}
                                >
                                    <SeatButton
                                        seat={seat}
                                        isSelected={selected}
                                        highlightedSeats={highlightedSeats}
                                        onClick={onSeatClick}
                                        style={{
                                            width: seat.position?.w || 56,
                                            height: seat.position?.h || 56,
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    groupSeatsByDeck(deckSeats).map((row, rowIdx) => (
                        <div key={rowIdx} className="seat-map__row">
                            {row.map((seat) => {
                                const selected = isSeatSelected(seat.label);
                                return (
                                    <div
                                        key={seat.label}
                                        className="seat-map__seat-wrapper"
                                    >
                                        <SeatButton
                                            seat={seat}
                                            isSelected={selected}
                                            highlightedSeats={highlightedSeats}
                                            onClick={onSeatClick}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SeatMapFloor;

