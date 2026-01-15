import React, { useEffect, useState, useMemo } from "react";
import {
    Calendar,
    Plus,
    Play,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateTripsFromTemplates,
    clearGenerateResult,
} from "../../../store/slices/scheduleTemplateSlice";
import { fetchRoutes } from "../../../store/slices/routeSlice";
import { fetchBuses } from "../../../store/slices/busSlice";
import CircularIndeterminate from "../../../components/Loading/Loading";
import WeeklyCalendar from "./components/WeeklyCalendar";
import TemplateFormModal from "./components/TemplateFormModal";
import GenerateTripsModal from "./components/GenerateTripsModal";
import "./ScheduleTemplate.scss";

const WEEKDAY_NAMES = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const ScheduleTemplate = () => {
    const dispatch = useAppDispatch();
    const { templates, loading, error } = useAppSelector(
        (state) => state.scheduleTemplate
    );
    const { routes } = useAppSelector((state) => state.route);
    const { buses } = useAppSelector((state) => state.bus);

    // Modals
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // Filters
    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [showInactive, setShowInactive] = useState(false);

    // Load data on mount
    useEffect(() => {
        dispatch(fetchTemplates({ per_page: 500 }));
        dispatch(fetchRoutes({ per_page: 500 }));
        dispatch(fetchBuses({ per_page: 500 }));
    }, [dispatch]);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        let result = [...templates];

        if (selectedRouteId) {
            result = result.filter(
                (t) => String(t.route_id) === String(selectedRouteId)
            );
        }

        if (!showInactive) {
            result = result.filter((t) => t.active);
        }

        return result;
    }, [templates, selectedRouteId, showInactive]);

    // Group templates by weekday for calendar view
    const templatesByWeekday = useMemo(() => {
        const grouped = {};
        for (let i = 0; i < 7; i++) {
            grouped[i] = [];
        }
        filteredTemplates.forEach((template) => {
            const weekday = template.weekday;
            if (grouped[weekday]) {
                grouped[weekday].push(template);
            }
        });
        // Sort each day by departure_time
        Object.keys(grouped).forEach((day) => {
            grouped[day].sort((a, b) =>
                a.departure_time.localeCompare(b.departure_time)
            );
        });
        return grouped;
    }, [filteredTemplates]);

    // Handlers
    const handleAddTemplate = (weekday = null) => {
        setEditingTemplate(weekday !== null ? { weekday } : null);
        setFormModalOpen(true);
    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setFormModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingTemplate?.id) {
                await dispatch(
                    updateTemplate({ id: editingTemplate.id, data: formData })
                ).unwrap();
            } else {
                await dispatch(createTemplate(formData)).unwrap();
            }
            setFormModalOpen(false);
            setEditingTemplate(null);
            dispatch(fetchTemplates({ per_page: 500 }));
        } catch (err) {
            console.error("Error saving template:", err);
            throw err;
        }
    };

    const handleDeleteTemplate = async (template) => {
        if (!window.confirm(`Bạn có chắc muốn xóa lịch mẫu này?`)) return;
        try {
            await dispatch(deleteTemplate(template.id)).unwrap();
        } catch (err) {
            console.error("Error deleting template:", err);
        }
    };

    const handleToggleActive = async (template) => {
        try {
            await dispatch(
                updateTemplate({
                    id: template.id,
                    data: { active: !template.active },
                })
            ).unwrap();
            dispatch(fetchTemplates({ per_page: 500 }));
        } catch (err) {
            console.error("Error toggling template:", err);
        }
    };

    // Handle drag-and-drop move template to different weekday
    const handleMoveTemplate = async (template, newWeekday) => {
        try {
            await dispatch(
                updateTemplate({
                    id: template.id,
                    data: { weekday: newWeekday },
                })
            ).unwrap();
            dispatch(fetchTemplates({ per_page: 500 }));
        } catch (err) {
            console.error("Error moving template:", err);
        }
    };

    const handleGenerateTrips = async (generateData) => {
        try {
            await dispatch(generateTripsFromTemplates(generateData)).unwrap();
        } catch (err) {
            console.error("Error generating trips:", err);
            throw err;
        }
    };

    const handleRefresh = () => {
        dispatch(fetchTemplates({ per_page: 500 }));
    };

    // Stats
    const stats = useMemo(() => {
        const totalActive = templates.filter((t) => t.active).length;
        const totalInactive = templates.filter((t) => !t.active).length;
        const byRoute = {};
        templates.forEach((t) => {
            const routeName = t.route?.name || `Route #${t.route_id}`;
            byRoute[routeName] = (byRoute[routeName] || 0) + 1;
        });
        return { totalActive, totalInactive, byRoute };
    }, [templates]);

    return (
        <div className="schedule-template">
            <div className="schedule-template__container">
                {/* Header */}
                <div className="schedule-template__header">
                    <div className="schedule-template__header-left">
                        <div className="schedule-template__title-group">
                            <Calendar className="schedule-template__icon" size={32} />
                            <div>
                                <h1 className="schedule-template__title">
                                    Lịch Trình Mẫu
                                </h1>
                                <p className="schedule-template__subtitle">
                                    Quản lý lịch chuyến xe mẫu theo tuần
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="schedule-template__header-right">
                        <button
                            className="schedule-template__btn schedule-template__btn--secondary"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? "spin" : ""} />
                            <span>Làm mới</span>
                        </button>
                        <button
                            className="schedule-template__btn schedule-template__btn--primary"
                            onClick={() => setGenerateModalOpen(true)}
                        >
                            <Play size={18} />
                            <span>Sinh chuyến xe</span>
                        </button>
                        <button
                            className="schedule-template__btn schedule-template__btn--accent"
                            onClick={() => handleAddTemplate()}
                        >
                            <Plus size={18} />
                            <span>Thêm lịch mẫu</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="schedule-template__stats">
                    <div className="schedule-template__stat-card schedule-template__stat-card--active">
                        <div className="schedule-template__stat-value">{stats.totalActive}</div>
                        <div className="schedule-template__stat-label">Đang hoạt động</div>
                    </div>
                    <div className="schedule-template__stat-card schedule-template__stat-card--inactive">
                        <div className="schedule-template__stat-value">{stats.totalInactive}</div>
                        <div className="schedule-template__stat-label">Tạm dừng</div>
                    </div>
                    <div className="schedule-template__stat-card schedule-template__stat-card--routes">
                        <div className="schedule-template__stat-value">
                            {Object.keys(stats.byRoute).length}
                        </div>
                        <div className="schedule-template__stat-label">Tuyến đường</div>
                    </div>
                    <div className="schedule-template__stat-card schedule-template__stat-card--total">
                        <div className="schedule-template__stat-value">{templates.length}</div>
                        <div className="schedule-template__stat-label">Tổng lịch mẫu</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="schedule-template__filters">
                    <div className="schedule-template__filter-group">
                        <Filter size={18} />
                        <select
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value)}
                            className="schedule-template__select"
                        >
                            <option value="">Tất cả tuyến đường</option>
                            {routes.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <label className="schedule-template__checkbox-label">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                        <span>Hiển thị lịch tạm dừng</span>
                    </label>
                </div>

                {/* Content */}
                <div className="schedule-template__content">
                    {loading ? (
                        <div className="schedule-template__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : error ? (
                        <div className="schedule-template__error">
                            <p>{error}</p>
                            <button
                                className="schedule-template__btn schedule-template__btn--primary"
                                onClick={handleRefresh}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <WeeklyCalendar
                            templatesByWeekday={templatesByWeekday}
                            routes={routes}
                            buses={buses}
                            onAddTemplate={handleAddTemplate}
                            onEditTemplate={handleEditTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                            onToggleActive={handleToggleActive}
                            onMoveTemplate={handleMoveTemplate}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            <TemplateFormModal
                open={formModalOpen}
                onClose={() => {
                    setFormModalOpen(false);
                    setEditingTemplate(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={editingTemplate}
                routes={routes}
                buses={buses}
            />

            <GenerateTripsModal
                open={generateModalOpen}
                onClose={() => {
                    setGenerateModalOpen(false);
                    dispatch(clearGenerateResult());
                }}
                onGenerate={handleGenerateTrips}
                templates={templates}
            />
        </div>
    );
};

export default ScheduleTemplate;
