import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchBuses,
    createBus as createBusThunk,
    updateBus as updateBusThunk,
    deleteBus as deleteBusThunk,
} from "../../../store/slices/busSlice";
import {
    fetchBusTypes,
    createBusType as createBusTypeThunk,
    updateBusType as updateBusTypeThunk,
    deleteBusType as deleteBusTypeThunk,
} from "../../../store/slices/busTypeSlice";
import { Bus, Car, Search, Plus, Filter } from "lucide-react";
import BusDataGrid from "./components/BusDataGrid";
import BusForm from "./components/BusForm";
import BusTypeDataGrid from "../BusType/components/BusTypeDataGrid";
import BusTypeForm from "../BusType/components/BusTypeForm";
import CircularIndeterminate from "../../../components/Loading/Loading";
import "./BusManagement.scss";
import { getErrorMessage } from "../../../utils/error";

const BusManagement = () => {
    const dispatch = useAppDispatch();
    const { buses, loading: busesLoading, error: busesError, pagination } = useAppSelector(
        (state) => state.bus
    );
    const { busTypes, loading: busTypesLoading, error: busTypesError } = useAppSelector(
        (state) => state.busType
    );

    const [activeTab, setActiveTab] = useState("buses"); // "buses" or "busTypes"

    // Bus states
    const [filteredBuses, setFilteredBuses] = useState([]);
    const [busSearchQuery, setBusSearchQuery] = useState("");
    const [busTypeFilter, setBusTypeFilter] = useState("");
    const [editingBus, setEditingBus] = useState(null);
    const [busFormOpen, setBusFormOpen] = useState(false);
    const [busFormMode, setBusFormMode] = useState("create");
    const [busDeleteDialogOpen, setBusDeleteDialogOpen] = useState(false);
    const [busToDelete, setBusToDelete] = useState(null);
    const [busDeleteLoading, setBusDeleteLoading] = useState(false);
    const [busDeleteError, setBusDeleteError] = useState("");
    const [seatLayoutTemplates, setSeatLayoutTemplates] = useState([]);

    // BusType states
    const [filteredBusTypes, setFilteredBusTypes] = useState([]);
    const [busTypeSearchQuery, setBusTypeSearchQuery] = useState("");
    const [busTypeSortOption, setBusTypeSortOption] = useState("newest");
    const [editingBusType, setEditingBusType] = useState(null);
    const [busTypeFormOpen, setBusTypeFormOpen] = useState(false);
    const [busTypeFormMode, setBusTypeFormMode] = useState("create");
    const [busTypeDeleteDialogOpen, setBusTypeDeleteDialogOpen] = useState(false);
    const [busTypeToDelete, setBusTypeToDelete] = useState(null);
    const [busTypeDeleteLoading, setBusTypeDeleteLoading] = useState(false);
    const [busTypeDeleteError, setBusTypeDeleteError] = useState("");

    // Gọi API khi component mount
    useEffect(() => {
        dispatch(fetchBuses({ per_page: 100, page: 1 }));
        dispatch(fetchBusTypes());
        // Load seat layout templates
        async function loadTemplates() {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/seat-layout-templates`);
                const data = await response.json();
                setSeatLayoutTemplates(data?.data || []);
            } catch (error) {
                console.error("Error loading seat layout templates:", error);
                setSeatLayoutTemplates([]);
            }
        }
        loadTemplates();
    }, [dispatch]);

    // Lọc và sắp xếp buses
    useEffect(() => {
        let filtered = [...buses];

        // Tìm kiếm
        if (busSearchQuery.trim() !== "") {
            const keyword = busSearchQuery.trim().toLowerCase();
            filtered = filtered.filter((bus) => {
                const searchText = `${bus.code || ""} ${bus.name || ""} ${bus.plate_number || ""}`.toLowerCase();
                return searchText.includes(keyword);
            });
        }

        // Lọc theo loại xe
        if (busTypeFilter) {
            filtered = filtered.filter((bus) => bus.type_bus_id === parseInt(busTypeFilter));
        }

        setFilteredBuses(filtered);
    }, [buses, busSearchQuery, busTypeFilter]);

    // Lọc và sắp xếp bus types
    useEffect(() => {
        let filtered = [...busTypes];

        if (busTypeSearchQuery.trim() !== "") {
            const keyword = busTypeSearchQuery.trim().toLowerCase();
            filtered = filtered.filter((bt) => {
                const searchText = (bt.name || "").toLowerCase();
                return searchText.includes(keyword);
            });
        }

        filtered.sort((a, b) => {
            if (busTypeSortOption === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (busTypeSortOption === "name-desc") {
                return (b.name || "").localeCompare(a.name || "");
            }
            if (busTypeSortOption === "seats-asc") {
                return (a.seat_count || 0) - (b.seat_count || 0);
            }
            if (busTypeSortOption === "seats-desc") {
                return (b.seat_count || 0) - (a.seat_count || 0);
            }
            const dateA = new Date(a.created_at || a.createdAt).getTime();
            const dateB = new Date(b.created_at || b.createdAt).getTime();
            if (busTypeSortOption === "oldest") {
                return dateA - dateB;
            }
            return dateB - dateA;
        });

        setFilteredBusTypes(filtered);
    }, [busTypes, busTypeSearchQuery, busTypeSortOption]);

    // Bus handlers
    const handleBusEdit = (bus) => {
        setEditingBus(bus);
        setBusFormMode("edit");
        setBusFormOpen(true);
    };

    const handleBusDeleteRequest = (bus) => {
        setBusToDelete(bus);
        setBusDeleteError("");
        setBusDeleteDialogOpen(true);
    };

    const handleBusConfirmDelete = async () => {
        if (!busToDelete) return;
        setBusDeleteLoading(true);
        setBusDeleteError("");
        try {
            await dispatch(deleteBusThunk(busToDelete.id)).unwrap();
            dispatch(fetchBuses({ per_page: 100, page: 1 }));
            setBusDeleteDialogOpen(false);
            setBusToDelete(null);
        } catch (error) {
            setBusDeleteError(getErrorMessage(error, "Có lỗi xảy ra khi xóa xe"));
        } finally {
            setBusDeleteLoading(false);
        }
    };

    const handleBusAddNew = () => {
        setEditingBus(null);
        setBusFormMode("create");
        setBusFormOpen(true);
    };

    const handleBusFormSubmit = async (formData) => {
        try {
            if (busFormMode === "edit" && editingBus) {
                await dispatch(updateBusThunk({ id: editingBus.id, busData: formData })).unwrap();
            } else {
                await dispatch(createBusThunk(formData)).unwrap();
            }
            dispatch(fetchBuses({ per_page: 100, page: 1 }));
            setBusFormOpen(false);
        } catch (error) {
            throw getErrorMessage(error, "Có lỗi xảy ra khi lưu xe");
        }
    };

    // BusType handlers
    const handleBusTypeEdit = (busType) => {
        setEditingBusType(busType);
        setBusTypeFormMode("edit");
        setBusTypeFormOpen(true);
    };

    const handleBusTypeDeleteRequest = (busType) => {
        setBusTypeToDelete(busType);
        setBusTypeDeleteError("");
        setBusTypeDeleteDialogOpen(true);
    };

    const handleBusTypeConfirmDelete = async () => {
        if (!busTypeToDelete) return;
        setBusTypeDeleteLoading(true);
        setBusTypeDeleteError("");
        try {
            await dispatch(deleteBusTypeThunk(busTypeToDelete.id)).unwrap();
            dispatch(fetchBusTypes());
            dispatch(fetchBuses({ per_page: 100, page: 1 })); // Refresh buses too
            setBusTypeDeleteDialogOpen(false);
            setBusTypeToDelete(null);
        } catch (error) {
            setBusTypeDeleteError(getErrorMessage(error, "Có lỗi xảy ra khi xóa loại xe"));
        } finally {
            setBusTypeDeleteLoading(false);
        }
    };

    const handleBusTypeAddNew = () => {
        setEditingBusType(null);
        setBusTypeFormMode("create");
        setBusTypeFormOpen(true);
    };

    const handleBusTypeFormSubmit = async (formData) => {
        try {
            if (busTypeFormMode === "edit" && editingBusType) {
                await dispatch(updateBusTypeThunk({ id: editingBusType.id, busTypeData: formData })).unwrap();
            } else {
                await dispatch(createBusTypeThunk(formData)).unwrap();
            }
            dispatch(fetchBusTypes());
            dispatch(fetchBuses({ per_page: 100, page: 1 })); // Refresh buses too
            setBusTypeFormOpen(false);
        } catch (error) {
            throw getErrorMessage(error, "Có lỗi xảy ra khi lưu loại xe");
        }
    };

    return (
        <div className="bus-management">
            <div className="bus-management__container">
                <div className="bus-management__header">
                    <div>
                        <h1 className="bus-management__title">
                            Quản lý xe và loại xe
                        </h1>
                        <p className="bus-management__subtitle">
                            Quản lý tất cả xe và loại xe trong hệ thống
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bus-management__tabs">
                    <button
                        className={`bus-management__tab ${activeTab === "buses" ? "bus-management__tab--active" : ""
                            }`}
                        onClick={() => setActiveTab("buses")}
                    >
                        <Bus size={20} />
                        <span>Quản lý xe ({buses.length})</span>
                    </button>
                    <button
                        className={`bus-management__tab ${activeTab === "busTypes" ? "bus-management__tab--active" : ""
                            }`}
                        onClick={() => setActiveTab("busTypes")}
                    >
                        <Car size={20} />
                        <span>Quản lý loại xe ({busTypes.length})</span>
                    </button>
                </div>

                {/* Bus Tab Content */}
                {activeTab === "buses" && (
                    <div className="bus-management__tab-content">
                        <div className="bus-management__actions">
                            <button
                                className="bus-management__add-btn"
                                onClick={handleBusAddNew}
                            >
                                <Plus size={20} />
                                <span>Thêm xe mới</span>
                            </button>
                            <div className="bus-management__filters">
                                <div className="bus-management__search">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm mã, tên, biển số..."
                                        value={busSearchQuery}
                                        onChange={(e) => setBusSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="bus-management__filter">
                                    <Filter size={18} />
                                    <select
                                        value={busTypeFilter}
                                        onChange={(e) => setBusTypeFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả loại xe</option>
                                        {busTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {busesLoading ? (
                            <div className="bus-management__loading">
                                <CircularIndeterminate />
                            </div>
                        ) : busesError ? (
                            <div className="bus-management__empty">
                                <p style={{ color: "#dc3545" }}>{busesError}</p>
                                <button
                                    type="button"
                                    className="bus-management__reset-btn"
                                    onClick={() => dispatch(fetchBuses({ per_page: 100, page: 1 }))}
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : filteredBuses.length === 0 ? (
                            <div className="bus-management__empty">
                                <Bus size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                                <p>Không tìm thấy xe nào.</p>
                            </div>
                        ) : (
                            <BusDataGrid
                                buses={filteredBuses}
                                onEdit={handleBusEdit}
                                onDelete={handleBusDeleteRequest}
                            />
                        )}
                    </div>
                )}

                {/* BusType Tab Content */}
                {activeTab === "busTypes" && (
                    <div className="bus-management__tab-content">
                        <div className="bus-management__actions">
                            <button
                                className="bus-management__add-btn"
                                onClick={handleBusTypeAddNew}
                            >
                                <Plus size={20} />
                                <span>Thêm loại xe mới</span>
                            </button>
                            <div className="bus-management__filters">
                                <div className="bus-management__search">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm loại xe..."
                                        value={busTypeSearchQuery}
                                        onChange={(e) => setBusTypeSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="bus-management__sort">
                                    <select
                                        value={busTypeSortOption}
                                        onChange={(e) => setBusTypeSortOption(e.target.value)}
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="oldest">Cũ nhất</option>
                                        <option value="name-asc">Tên A-Z</option>
                                        <option value="name-desc">Tên Z-A</option>
                                        <option value="seats-asc">Số ghế tăng dần</option>
                                        <option value="seats-desc">Số ghế giảm dần</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {busTypesLoading ? (
                            <div className="bus-management__loading">
                                <CircularIndeterminate />
                            </div>
                        ) : busTypesError ? (
                            <div className="bus-management__empty">
                                <p style={{ color: "#dc3545" }}>{busTypesError}</p>
                                <button
                                    type="button"
                                    className="bus-management__reset-btn"
                                    onClick={() => dispatch(fetchBusTypes())}
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : filteredBusTypes.length === 0 ? (
                            <div className="bus-management__empty">
                                <Car size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                                <p>Không tìm thấy loại xe nào.</p>
                            </div>
                        ) : (
                            <BusTypeDataGrid
                                busTypes={filteredBusTypes}
                                onEdit={handleBusTypeEdit}
                                onDelete={handleBusTypeDeleteRequest}
                            />
                        )}
                    </div>
                )}

                {/* Bus Form Modal */}
                <BusForm
                    open={busFormOpen}
                    onClose={() => setBusFormOpen(false)}
                    onSubmit={handleBusFormSubmit}
                    initialData={busFormMode === "edit" ? editingBus : null}
                    seatLayoutTemplates={seatLayoutTemplates}
                />

                {/* BusType Form Modal */}
                <BusTypeForm
                    open={busTypeFormOpen}
                    onClose={() => setBusTypeFormOpen(false)}
                    onSubmit={handleBusTypeFormSubmit}
                    initialData={busTypeFormMode === "edit" ? editingBusType : null}
                />

                {/* Bus Delete Dialog */}
                {busDeleteDialogOpen && (
                    <div className="bus-management__confirm-overlay">
                        <div className="bus-management__confirm-modal">
                            <h3>Xóa xe</h3>
                            <p>
                                Bạn có chắc chắn muốn xóa{" "}
                                <strong>{busToDelete?.name || "xe này"}</strong>? Hành động này không thể hoàn tác.
                            </p>
                            {busDeleteError && (
                                <p className="bus-management__confirm-error">{busDeleteError}</p>
                            )}
                            <div className="bus-management__confirm-actions">
                                <button
                                    type="button"
                                    className="bus-management__confirm-btn bus-management__confirm-btn--cancel"
                                    onClick={() => {
                                        if (!busDeleteLoading) {
                                            setBusDeleteDialogOpen(false);
                                            setBusToDelete(null);
                                            setBusDeleteError("");
                                        }
                                    }}
                                    disabled={busDeleteLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="bus-management__confirm-btn bus-management__confirm-btn--danger"
                                    onClick={handleBusConfirmDelete}
                                    disabled={busDeleteLoading}
                                >
                                    {busDeleteLoading ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BusType Delete Dialog */}
                {busTypeDeleteDialogOpen && (
                    <div className="bus-management__confirm-overlay">
                        <div className="bus-management__confirm-modal">
                            <h3>Xóa loại xe</h3>
                            <p>
                                Bạn có chắc chắn muốn xóa{" "}
                                <strong>{busTypeToDelete?.name || "loại xe này"}</strong>? Hành động này không thể hoàn tác.
                            </p>
                            {busTypeDeleteError && (
                                <p className="bus-management__confirm-error">{busTypeDeleteError}</p>
                            )}
                            <div className="bus-management__confirm-actions">
                                <button
                                    type="button"
                                    className="bus-management__confirm-btn bus-management__confirm-btn--cancel"
                                    onClick={() => {
                                        if (!busTypeDeleteLoading) {
                                            setBusTypeDeleteDialogOpen(false);
                                            setBusTypeToDelete(null);
                                            setBusTypeDeleteError("");
                                        }
                                    }}
                                    disabled={busTypeDeleteLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="bus-management__confirm-btn bus-management__confirm-btn--danger"
                                    onClick={handleBusTypeConfirmDelete}
                                    disabled={busTypeDeleteLoading}
                                >
                                    {busTypeDeleteLoading ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusManagement;

