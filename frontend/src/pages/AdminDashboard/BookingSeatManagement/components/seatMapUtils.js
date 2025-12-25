/**
 * Utility functions for SeatMap component
 */

export const getSeatRowIndex = (seat = {}) => {
    if (typeof seat.index === "number") return seat.index;
    const numericPart = parseInt(
        (seat.label || "").replace(/^\D+/g, "") || "0",
        10
    );
    return Number.isNaN(numericPart) ? 0 : numericPart;
};

export const getColumnPriority = (seat = {}) => {
    const columnGroup =
        (seat.column_group || seat.label || "").replace(/[0-9]/g, "") ||
        "default";
    const priorities = ["B", "C", "A", "D", "default"];
    const index = priorities.indexOf(columnGroup);
    return index === -1 ? priorities.length : index;
};

export const groupSeatsByDeck = (deckSeats = []) => {
    const rows = deckSeats.reduce((acc, seat) => {
        const rowKey = getSeatRowIndex(seat);
        if (!acc[rowKey]) acc[rowKey] = [];
        acc[rowKey].push(seat);
        return acc;
    }, {});

    return Object.entries(rows)
        .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
        .map(([, rowSeats]) =>
            rowSeats.sort((a, b) => {
                const priorityDiff =
                    getColumnPriority(a) - getColumnPriority(b);
                if (priorityDiff !== 0) return priorityDiff;
                return (a.label || "").localeCompare(b.label || "");
            })
        );
};

export const hasCustomPosition = (seat = {}) => {
    const pos = seat.position || {};
    return (
        typeof pos.x === "number" &&
        typeof pos.y === "number" &&
        typeof pos.w === "number" &&
        typeof pos.h === "number"
    );
};

export const buildCanvasSize = (deckSeats = []) => {
    const fallback = {
        width: 360,
        height: 320,
    };
    if (!deckSeats.length) return fallback;
    const maxX = Math.max(
        ...deckSeats.map((seat) =>
            hasCustomPosition(seat)
                ? (seat.position.x || 0) + (seat.position.w || 48)
                : 0
        ),
        0
    );
    const maxY = Math.max(
        ...deckSeats.map((seat) =>
            hasCustomPosition(seat)
                ? (seat.position.y || 0) + (seat.position.h || 48)
                : 0
        ),
        0
    );
    return {
        width: `${Math.max(fallback.width, maxX + 40)}px`,
        height: `${Math.max(fallback.height, maxY + 40)}px`,
    };
};

export const getCanvasStyle = (deckSeats = [], layout = null) => {
    if (layout && layout.canvas) {
        return {
            width: `${layout.canvas.width}px`,
            height: `${layout.canvas.height}px`,
        };
    }
    return buildCanvasSize(deckSeats);
};

export const getSeatClassName = (status, label, highlightedSeats = []) => {
    const baseClass = "seat-map__seat";
    let className;
    switch (status) {
        case "booked":
            className = `${baseClass} ${baseClass}--booked`;
            break;
        case "selected":
            className = `${baseClass} ${baseClass}--selected`;
            break;
        case "locked":
            className = `${baseClass} ${baseClass}--locked`;
            break;
        default:
            className = `${baseClass} ${baseClass}--available`;
    }

    // Add highlight class if seat is in search results
    if (highlightedSeats && highlightedSeats.includes(label)) {
        className += ` ${baseClass}--highlighted`;
    }

    return className;
};
