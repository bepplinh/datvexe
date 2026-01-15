import React, { useMemo, useState } from "react";
import { Plus, GripVertical } from "lucide-react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    useDroppable,
    useDraggable,
} from "@dnd-kit/core";
import TimeSlotCard from "./TimeSlotCard";
import "./WeeklyCalendar.scss";

const WEEKDAYS = [
    { key: 1, label: "Thứ 2", shortLabel: "T2" },
    { key: 2, label: "Thứ 3", shortLabel: "T3" },
    { key: 3, label: "Thứ 4", shortLabel: "T4" },
    { key: 4, label: "Thứ 5", shortLabel: "T5" },
    { key: 5, label: "Thứ 6", shortLabel: "T6" },
    { key: 6, label: "Thứ 7", shortLabel: "T7" },
    { key: 0, label: "Chủ nhật", shortLabel: "CN" },
];

// Time slots from 5:00 to 23:00
const TIME_SLOTS = [];
for (let h = 5; h <= 23; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
}

// Generate color from route_id for consistent coloring
const getRouteColor = (routeId) => {
    const colors = [
        { bg: "rgba(139, 92, 246, 0.2)", border: "#8b5cf6", text: "#a78bfa" },
        { bg: "rgba(59, 130, 246, 0.2)", border: "#3b82f6", text: "#60a5fa" },
        { bg: "rgba(16, 185, 129, 0.2)", border: "#10b981", text: "#34d399" },
        { bg: "rgba(245, 158, 11, 0.2)", border: "#f59e0b", text: "#fbbf24" },
        { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#f87171" },
        { bg: "rgba(236, 72, 153, 0.2)", border: "#ec4899", text: "#f472b6" },
        { bg: "rgba(20, 184, 166, 0.2)", border: "#14b8a6", text: "#2dd4bf" },
        { bg: "rgba(168, 85, 247, 0.2)", border: "#a855f7", text: "#c084fc" },
    ];
    return colors[routeId % colors.length];
};

// Draggable TimeSlotCard wrapper
const DraggableTimeSlotCard = ({
    template,
    colorScheme,
    onEdit,
    onDelete,
    onToggleActive,
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `template-${template.id}`,
        data: { template },
    });

    return (
        <div
            ref={setNodeRef}
            className={`draggable-card ${isDragging ? "draggable-card--dragging" : ""}`}
            {...attributes}
        >
            <div className="draggable-card__handle" {...listeners}>
                <GripVertical size={14} />
            </div>
            <div className="draggable-card__content">
                <TimeSlotCard
                    template={template}
                    colorScheme={colorScheme}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                />
            </div>
        </div>
    );
};

// Droppable day cell wrapper
const DroppableCell = ({ weekday, hour, children, onAddTemplate }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `cell-${weekday}-${hour}`,
        data: { weekday, hour },
    });

    return (
        <div
            ref={setNodeRef}
            className={`weekly-calendar__cell ${isOver ? "weekly-calendar__cell--drag-over" : ""}`}
            onClick={() => {
                if (React.Children.count(children) === 0) {
                    onAddTemplate(weekday);
                }
            }}
        >
            {children}
        </div>
    );
};

const WeeklyCalendar = ({
    templatesByWeekday,
    routes,
    buses,
    onAddTemplate,
    onEditTemplate,
    onDeleteTemplate,
    onToggleActive,
    onMoveTemplate,
}) => {
    const [activeTemplate, setActiveTemplate] = useState(null);

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum drag distance before activation
            },
        })
    );

    // Get hour from departure_time for positioning
    const getSlotHour = (departureTime) => {
        if (!departureTime) return 5;
        const [hours] = departureTime.split(":");
        return parseInt(hours, 10);
    };

    // Group templates by hour within each weekday
    const getTemplatesForHour = (weekday, hour) => {
        const dayTemplates = templatesByWeekday[weekday] || [];
        return dayTemplates.filter((t) => getSlotHour(t.departure_time) === hour);
    };

    // Check if any templates exist for a given hour across all days
    const hasTemplatesAtHour = (hour) => {
        return WEEKDAYS.some((day) => getTemplatesForHour(day.key, hour).length > 0);
    };

    // Filter time slots to only show those with content, plus some buffer
    const activeTimeSlots = useMemo(() => {
        const hoursWithContent = new Set();
        TIME_SLOTS.forEach((slot) => {
            const hour = parseInt(slot.split(":")[0], 10);
            if (hasTemplatesAtHour(hour)) {
                hoursWithContent.add(hour);
                // Add buffer hours
                if (hour > 5) hoursWithContent.add(hour - 1);
                if (hour < 23) hoursWithContent.add(hour + 1);
            }
        });
        // If no content, show all slots
        if (hoursWithContent.size === 0) {
            return TIME_SLOTS;
        }
        return TIME_SLOTS.filter((slot) => {
            const hour = parseInt(slot.split(":")[0], 10);
            return hoursWithContent.has(hour);
        });
    }, [templatesByWeekday]);

    // Handle drag start
    const handleDragStart = (event) => {
        const { active } = event;
        const template = active.data.current?.template;
        if (template) {
            setActiveTemplate(template);
        }
    };

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTemplate(null);

        if (!over) return;

        const template = active.data.current?.template;
        const targetData = over.data.current;

        if (!template || !targetData) return;

        const newWeekday = targetData.weekday;

        // Only update if moved to a different day
        if (template.weekday !== newWeekday) {
            if (onMoveTemplate) {
                onMoveTemplate(template, newWeekday);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="weekly-calendar">
                {/* Header row with weekday names */}
                <div className="weekly-calendar__header">
                    <div className="weekly-calendar__time-header">Giờ</div>
                    {WEEKDAYS.map((day) => (
                        <div key={day.key} className="weekly-calendar__day-header">
                            <span className="weekly-calendar__day-label">{day.label}</span>
                            <span className="weekly-calendar__day-count">
                                {(templatesByWeekday[day.key] || []).length} lịch
                            </span>
                        </div>
                    ))}
                </div>

                {/* Time grid */}
                <div className="weekly-calendar__grid">
                    {activeTimeSlots.map((timeSlot) => {
                        const hour = parseInt(timeSlot.split(":")[0], 10);
                        return (
                            <div key={timeSlot} className="weekly-calendar__row">
                                {/* Time column */}
                                <div className="weekly-calendar__time-cell">
                                    <span>{timeSlot}</span>
                                </div>

                                {/* Day cells */}
                                {WEEKDAYS.map((day) => {
                                    const templates = getTemplatesForHour(day.key, hour);
                                    return (
                                        <DroppableCell
                                            key={`${day.key}-${hour}`}
                                            weekday={day.key}
                                            hour={hour}
                                            onAddTemplate={onAddTemplate}
                                        >
                                            {templates.length > 0 ? (
                                                <div className="weekly-calendar__slots">
                                                    {templates.map((template) => (
                                                        <DraggableTimeSlotCard
                                                            key={template.id}
                                                            template={template}
                                                            colorScheme={getRouteColor(template.route_id)}
                                                            onEdit={() => onEditTemplate(template)}
                                                            onDelete={() => onDeleteTemplate(template)}
                                                            onToggleActive={() => onToggleActive(template)}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="weekly-calendar__empty-cell">
                                                    <Plus size={16} />
                                                </div>
                                            )}
                                        </DroppableCell>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Add row button */}
                <div className="weekly-calendar__footer">
                    <button
                        className="weekly-calendar__add-btn"
                        onClick={() => onAddTemplate(null)}
                    >
                        <Plus size={18} />
                        <span>Thêm lịch mẫu mới</span>
                    </button>
                </div>
            </div>

            {/* Drag Overlay - shows a preview while dragging */}
            <DragOverlay>
                {activeTemplate ? (
                    <div className="drag-overlay">
                        <TimeSlotCard
                            template={activeTemplate}
                            colorScheme={getRouteColor(activeTemplate.route_id)}
                            onEdit={() => { }}
                            onDelete={() => { }}
                            onToggleActive={() => { }}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default WeeklyCalendar;
