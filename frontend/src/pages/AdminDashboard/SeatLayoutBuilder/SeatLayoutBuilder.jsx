import { useEffect, useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-toastify";
import axiosClient from "../../../apis/axiosClient";
import "./SeatLayoutBuilder.scss";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const DEFAULT_LEGEND = [
    { label: "Ghế trống", color: "#E0E7FF" },
    { label: "Đang giữ", color: "#FDE68A" },
    { label: "Đã bán", color: "#FCA5A5" },
];

const applyLayoutDefaults = (layout = {}) => ({
    decks: layout.decks ?? 1,
    cell_size: layout.cell_size ?? 48,
    canvas: {
        width: layout.canvas?.width ?? 720,
        height: layout.canvas?.height ?? 480,
    },
    legend: layout.legend ?? DEFAULT_LEGEND,
});

const createClientId = () =>
    (globalThis.crypto?.randomUUID?.() ??
        Math.random().toString(36).slice(2));

const normalizeClientId = (seat) =>
    seat?.seat_id !== undefined && seat?.seat_id !== null
        ? `seat-${seat.seat_id}`
        : createClientId();

const buildClientSeat = (seat) => ({
    clientId: normalizeClientId(seat),
    seat_id: seat?.seat_id ?? null,
    label: seat?.label ?? "NEW",
    deck: seat?.deck ?? 1,
    column_group: seat?.column_group ?? "A",
    index: seat?.index ?? 0,
    seat_type: seat?.seat_type ?? "standard",
    active: seat?.active ?? true,
    position: {
        x: seat?.position?.x ?? 24,
        y: seat?.position?.y ?? 24,
        w: seat?.position?.w ?? 48,
        h: seat?.position?.h ?? 48,
    },
    meta: seat?.meta ?? {},
});

function SeatNode({ seat, isActive, onSelect }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: seat.clientId,
        activationConstraint: { distance: 6 }, // prevent accidental drag on click
    });

    const style = {
        width: seat.position.w,
        height: seat.position.h,
        transform: transform
            ? CSS.Translate.toString(transform)
            : undefined,
        left: seat.position.x,
        top: seat.position.y,
    };

    return (
        <button
            type="button"
            ref={setNodeRef}
            style={style}
            className={`seat-builder__seat ${isActive ? "seat-builder__seat--active" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(seat.clientId);
            }}
            {...listeners}
            {...attributes}
        >
            <span>{seat.label}</span>
        </button>
    );
}

export default function SeatLayoutBuilder() {
    const [buses, setBuses] = useState([]);
    const [selectedBusId, setSelectedBusId] = useState("");
    const [layout, setLayout] = useState(applyLayoutDefaults());
    const [seats, setSeats] = useState([]);
    const [activeSeat, setActiveSeat] = useState(null);
    const [activeDeck, setActiveDeck] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadBuses() {
            try {
                const { data } = await axiosClient.get("/buses", {
                    params: { per_page: 100 },
                });
                const list = data?.data?.data ?? [];
                setBuses(list);
                if (list.length && !selectedBusId) {
                    setSelectedBusId(list[0].id);
                }
            } catch (error) {
                toast.error("Không thể tải danh sách xe");
            }
        }
        loadBuses();
    }, []);

    useEffect(() => {
        if (!selectedBusId) return;
        async function loadLayout() {
            setLoading(true);
            setActiveSeat(null);
            try {
                const { data } = await axiosClient.get(
                    `/admin/buses/${selectedBusId}/seat-layout`
                );
                if (data?.data) {
                    setLayout(applyLayoutDefaults(data.data.layout));
                    setSeats(
                        (data.data.seats || []).map((seat) =>
                            buildClientSeat(seat)
                        )
                    );
                    setActiveDeck(1);
                }
            } catch (error) {
                toast.error("Không thể tải sơ đồ ghế");
            } finally {
                setLoading(false);
            }
        }
        loadLayout();
    }, [selectedBusId]);

    const visibleSeats = useMemo(
        () => seats.filter((seat) => seat.deck === activeDeck),
        [seats, activeDeck]
    );

    const selectedSeat = useMemo(
        () => seats.find((seat) => seat.clientId === activeSeat),
        [seats, activeSeat]
    );

    const handleDragEnd = (event) => {
        const { active, delta } = event;
        if (!active?.id) return;
        setSeats((prev) =>
            prev.map((seat) => {
                if (seat.clientId !== active.id) return seat;
                const nextX = seat.position.x + delta.x;
                const nextY = seat.position.y + delta.y;
                const canvasWidth = layout.canvas.width - seat.position.w;
                const canvasHeight = layout.canvas.height - seat.position.h;
                return {
                    ...seat,
                    position: {
                        ...seat.position,
                        x: clamp(nextX, 0, canvasWidth),
                        y: clamp(nextY, 0, canvasHeight),
                    },
                };
            })
        );
    };

    const handleSeatFieldChange = (field, value) => {
        if (!selectedSeat) return;
        setSeats((prev) =>
            prev.map((seat) =>
                seat.clientId === selectedSeat.clientId
                    ? {
                          ...seat,
                          [field]:
                              field === "deck" || field === "index"
                                  ? Number(value)
                                  : value,
                      }
                    : seat
            )
        );
        if (field === "deck") {
            setActiveDeck(Number(value) || 1);
        }
    };

    const handleSeatPositionChange = (field, value) => {
        if (!selectedSeat) return;
        const numeric = Number(value) || 0;
        const safeValue =
            field === "w" || field === "h"
                ? Math.max(24, numeric)
                : Math.max(0, numeric);
        setSeats((prev) =>
            prev.map((seat) =>
                seat.clientId === selectedSeat.clientId
                    ? {
                          ...seat,
                          position: {
                              ...seat.position,
                              [field]: safeValue,
                          },
                      }
                    : seat
            )
        );
    };

    const handleAddSeat = () => {
        const newSeat = buildClientSeat({
            label: `N${seats.length + 1}`,
            deck: activeDeck,
            position: { x: 24, y: 24, w: 48, h: 48 },
            column_group: "A",
            index: seats.length,
        });
        setSeats((prev) => [...prev, newSeat]);
        setActiveSeat(newSeat.clientId);
    };

    const handleDeleteSeat = () => {
        if (!selectedSeat) return;
        setSeats((prev) =>
            prev.filter((seat) => seat.clientId !== selectedSeat.clientId)
        );
        setActiveSeat(null);
    };

    const handleSave = async () => {
        if (!selectedBusId) return;
        setSaving(true);
        try {
            const payload = {
                layout,
                seats: seats.map((seat, index) => ({
                    seat_id: seat.seat_id,
                    label: seat.label,
                    deck: seat.deck,
                    column_group: seat.column_group,
                    index: seat.index ?? index,
                    seat_type: seat.seat_type,
                    active: seat.active,
                    position: seat.position,
                    meta: seat.meta,
                })),
            };
            await axiosClient.put(
                `/admin/buses/${selectedBusId}/seat-layout`,
                payload
            );
            toast.success("Đã lưu sơ đồ ghế");
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Lưu sơ đồ ghế thất bại"
            );
        } finally {
            setSaving(false);
        }
    };

    const decks = useMemo(
        () => Array.from({ length: layout.decks || 1 }, (_, i) => i + 1),
        [layout.decks]
    );

    return (
        <div className="seat-builder">
            <header className="seat-builder__header">
                <div className="seat-builder__field">
                    <label>Chọn xe</label>
                    <select
                        value={selectedBusId}
                        onChange={(e) => setSelectedBusId(e.target.value)}
                        disabled={!buses.length}
                    >
                        {buses.length === 0 ? (
                            <option>Chưa có dữ liệu xe</option>
                        ) : (
                            buses.map((bus) => (
                                <option key={bus.id} value={bus.id}>
                                    {bus.name} - {bus.plate_number}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div className="seat-builder__actions">
                    <button
                        className="seat-builder__button"
                        onClick={handleAddSeat}
                    >
                        Thêm ghế
                    </button>
                    <button
                        className="seat-builder__button seat-builder__button--primary"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {saving ? "Đang lưu..." : "Lưu sơ đồ"}
                    </button>
                </div>
            </header>

            <div className="seat-builder__body">
                <aside className="seat-builder__sidebar">
                    <div className="seat-builder__panel">
                        <h3>Thông số bố cục</h3>
                        <div className="seat-builder__field">
                            <label>Số tầng</label>
                            <input
                                type="number"
                                min="1"
                                max="4"
                                value={layout.decks}
                                onChange={(e) =>
                                    setLayout((prev) => ({
                                        ...prev,
                                        decks: Number(e.target.value) || 1,
                                    }))
                                }
                            />
                        </div>
                        <div className="seat-builder__field">
                            <label>Chiều rộng canvas(px)</label>
                            <input
                                type="number"
                                min="200"
                                max="2000"
                                value={layout.canvas.width}
                                onChange={(e) =>
                                    setLayout((prev) => ({
                                        ...prev,
                                        canvas: {
                                            ...prev.canvas,
                                            width: Number(e.target.value) || 200,
                                        },
                                    }))
                                }
                            />
                        </div>
                        <div className="seat-builder__field">
                            <label>Chiều cao canvas(px)</label>
                            <input
                                type="number"
                                min="200"
                                max="2000"
                                value={layout.canvas.height}
                                onChange={(e) =>
                                    setLayout((prev) => ({
                                        ...prev,
                                        canvas: {
                                            ...prev.canvas,
                                            height:
                                                Number(e.target.value) || 200,
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="seat-builder__panel">
                        <div className="seat-builder__panel-header">
                            <h3>Ghế đang chọn</h3>
                            {selectedSeat && (
                                <button
                                    className="seat-builder__button seat-builder__button--danger"
                                    onClick={handleDeleteSeat}
                                >
                                    Xoá
                                </button>
                            )}
                        </div>
                        {selectedSeat ? (
                            <div className="seat-builder__form">
                                <div className="seat-builder__field">
                                    <label>Nhãn ghế</label>
                                    <input
                                        type="text"
                                        value={selectedSeat.label}
                                        onChange={(e) =>
                                            handleSeatFieldChange(
                                                "label",
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                    />
                                </div>
                                <div className="seat-builder__field">
                                    <label>Tầng</label>
                                    <select
                                        value={selectedSeat.deck}
                                        onChange={(e) =>
                                            handleSeatFieldChange(
                                                "deck",
                                                e.target.value
                                            )
                                        }
                                    >
                                        {decks.map((deck) => (
                                            <option key={deck} value={deck}>
                                                Tầng {deck}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="seat-builder__field">
                                    <label>Nhóm cột</label>
                                    <input
                                        type="text"
                                        value={selectedSeat.column_group}
                                        onChange={(e) =>
                                            handleSeatFieldChange(
                                                "column_group",
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                    />
                                </div>
                                <div className="seat-builder__field">
                                    <label>Thứ tự trong cột</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedSeat.index}
                                        onChange={(e) =>
                                            handleSeatFieldChange(
                                                "index",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="seat-builder__field">
                                    <label>Loại ghế</label>
                                    <input
                                        type="text"
                                        value={selectedSeat.seat_type}
                                        onChange={(e) =>
                                            handleSeatFieldChange(
                                                "seat_type",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="seat-builder__field-grid">
                                    <div>
                                        <label>X (px)</label>
                                        <input
                                            type="number"
                                            value={selectedSeat.position.x}
                                            onChange={(e) =>
                                                handleSeatPositionChange(
                                                    "x",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label>Y (px)</label>
                                        <input
                                            type="number"
                                            value={selectedSeat.position.y}
                                            onChange={(e) =>
                                                handleSeatPositionChange(
                                                    "y",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="seat-builder__field-grid">
                                    <div>
                                        <label>Rộng (px)</label>
                                        <input
                                            type="number"
                                            value={selectedSeat.position.w}
                                            onChange={(e) =>
                                                handleSeatPositionChange(
                                                    "w",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label>Cao (px)</label>
                                        <input
                                            type="number"
                                            value={selectedSeat.position.h}
                                            onChange={(e) =>
                                                handleSeatPositionChange(
                                                    "h",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="seat-builder__empty">
                                Chọn ghế trên canvas để chỉnh sửa
                            </p>
                        )}
                    </div>
                </aside>

                <section className="seat-builder__canvas-wrapper">
                    <div className="seat-builder__deck-tabs">
                        {decks.map((deck) => (
                            <button
                                key={deck}
                                className={`seat-builder__deck-tab ${
                                    activeDeck === deck
                                        ? "seat-builder__deck-tab--active"
                                        : ""
                                }`}
                                onClick={() => setActiveDeck(deck)}
                            >
                                Tầng {deck}
                            </button>
                        ))}
                    </div>

                    <div className="seat-builder__canvas-meta">
                        <span>
                            {visibleSeats.length} ghế (tổng {seats.length})
                        </span>
                        <span>Kéo thả ghế để sắp xếp vị trí</span>
                    </div>

                    <DndContext onDragEnd={handleDragEnd}>
                        <div
                            className="seat-builder__canvas"
                            style={{
                                width: layout.canvas.width,
                                height: layout.canvas.height,
                                backgroundSize: `${layout.cell_size}px ${layout.cell_size}px`,
                            }}
                            onClick={() => setActiveSeat(null)}
                        >
                            {loading && (
                                <div className="seat-builder__canvas-loading">
                                    Đang tải sơ đồ...
                                </div>
                            )}

                            {!loading &&
                                visibleSeats.map((seat) => (
                                    <SeatNode
                                        key={seat.clientId}
                                        seat={seat}
                                        isActive={
                                            activeSeat === seat.clientId
                                        }
                                        onSelect={setActiveSeat}
                                    />
                                ))}
                        </div>
                    </DndContext>
                </section>
            </div>
        </div>
    );
}

