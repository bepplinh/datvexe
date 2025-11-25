import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchLocations,
    createLocation as createLocationThunk,
    updateLocation as updateLocationThunk,
    deleteLocation as deleteLocationThunk,
} from "../../../store/slices/locationSlice";
import { MapPin, Search, Plus, LayoutGrid, TreePine } from "lucide-react";
import LocationDataGrid from "./components/LocationDataGrid";
import LocationTreeView from "./components/LocationTreeView";
import BreadcrumbNavigation from "./components/BreadcrumbNavigation";
import LocationForm from "./components/LocationForm";
import { LocationFilters } from "./components/LocationFilters";
import CircularIndeterminate from "../../../components/Loading/Loading";
import "./Location.scss";
import { getErrorMessage } from "../../../utils/error";

const Location = () => {
    const dispatch = useAppDispatch();
    const { locations, loading, error, pagination } = useAppSelector(
        (state) => state.location
    );

    const [filteredLocations, setFilteredLocations] = useState([]);
    const [filters, setFilters] = useState({
        type: "",
        parent_id: "",
        city_id: "",
        district_id: "",
        from_date: "",
        to_date: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [activeQuickFilter, setActiveQuickFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // "table" or "tree"
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create"); // "create" or "edit"
    const [formParent, setFormParent] = useState(null);
    const [editingLocation, setEditingLocation] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Gọi API khi component mount
    useEffect(() => {
        dispatch(fetchLocations({ per_page: 100, page: 1 }));
    }, [dispatch]);

    // Tính stats từ data thực tế
    const stats = useMemo(() => {
        const total = locations.length;
        const cities = locations.filter((loc) => loc.type === "city").length;
        const districts = locations.filter(
            (loc) => loc.type === "district"
        ).length;
        const wards = locations.filter((loc) => loc.type === "ward").length;

        return [
            {
                label: "Tổng số địa điểm",
                value: total,
                accent: "primary",
            },
            {
                label: "Thành phố",
                value: cities,
                accent: "success",
            },
            {
                label: "Quận/Huyện",
                value: districts,
                accent: "info",
            },
            {
                label: "Phường/Xã",
                value: wards,
                accent: "warning",
            },
        ];
    }, [locations]);

    // Lọc và sắp xếp locations
    useEffect(() => {
        let filtered = [...locations];

        // Lọc theo type
        if (filters.type !== "") {
            filtered = filtered.filter((loc) => loc.type === filters.type);
        }

        // Lọc theo parent_id
        if (filters.parent_id !== "") {
            filtered = filtered.filter(
                (loc) => loc.parent_id === parseInt(filters.parent_id)
            );
        }

        // Lọc theo city_id
        if (filters.city_id !== "") {
            filtered = filtered.filter(
                (loc) =>
                    loc.parent_id === parseInt(filters.city_id) ||
                    loc.id === parseInt(filters.city_id)
            );
        }

        // Lọc theo district_id
        if (filters.district_id !== "") {
            filtered = filtered.filter(
                (loc) =>
                    loc.parent_id === parseInt(filters.district_id) ||
                    loc.id === parseInt(filters.district_id)
            );
        }

        // Lọc theo ngày tạo
        if (filters.from_date !== "") {
            filtered = filtered.filter((loc) => {
                const locDate = new Date(loc.created_at || loc.createdAt);
                const fromDate = new Date(filters.from_date);
                return locDate >= fromDate;
            });
        }

        if (filters.to_date !== "") {
            filtered = filtered.filter((loc) => {
                const locDate = new Date(loc.created_at || loc.createdAt);
                const toDate = new Date(filters.to_date);
                toDate.setHours(23, 59, 59, 999);
                return locDate <= toDate;
            });
        }

        // Tìm kiếm theo tên
        if (searchQuery.trim() !== "") {
            const keyword = searchQuery.trim().toLowerCase();
            filtered = filtered.filter((loc) => {
                const searchText = (loc.name || "").toLowerCase();
                return searchText.includes(keyword);
            });
        }

        // Sắp xếp
        filtered.sort((a, b) => {
            if (sortOption === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortOption === "name-desc") {
                return (b.name || "").localeCompare(a.name || "");
            }

            const dateA = new Date(a.created_at || a.createdAt).getTime();
            const dateB = new Date(b.created_at || b.createdAt).getTime();

            if (sortOption === "oldest") {
                return dateA - dateB;
            }

            // default newest
            return dateB - dateA;
        });

        setFilteredLocations(filtered);
    }, [locations, filters, searchQuery, sortOption]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            type: "",
            parent_id: "",
            city_id: "",
            district_id: "",
            from_date: "",
            to_date: "",
        });
        setSearchQuery("");
        setActiveQuickFilter("all");
        setSortOption("newest");
        setSelectedLocation(null);
        setBreadcrumbPath([]);
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        // Xây dựng breadcrumb path
        const buildPath = (loc, allLocs) => {
            const path = [loc];
            if (loc.parent_id) {
                const parent = allLocs.find((l) => l.id === loc.parent_id);
                if (parent) {
                    return [...buildPath(parent, allLocs), ...path];
                }
            }
            return path;
        };
        setBreadcrumbPath(buildPath(location, locations));
    };

    const handleBreadcrumbNavigate = (location) => {
        handleLocationSelect(location);
        // Tự động filter theo location được chọn
        if (location.type === "city") {
            setFilters((prev) => ({
                ...prev,
                city_id: location.id.toString(),
                district_id: "",
                parent_id: location.id.toString(),
            }));
        } else if (location.type === "district") {
            setFilters((prev) => ({
                ...prev,
                district_id: location.id.toString(),
                parent_id: location.id.toString(),
            }));
        }
    };

    const handleBreadcrumbHome = () => {
        setSelectedLocation(null);
        setBreadcrumbPath([]);
        handleResetFilters();
    };

    const quickFilters = [
        { key: "all", label: "Tất cả", type: "" },
        { key: "city", label: "Thành phố", type: "city" },
        { key: "district", label: "Quận/Huyện", type: "district" },
        { key: "ward", label: "Phường/Xã", type: "ward" },
    ];

    const handleQuickFilter = (filter) => {
        setActiveQuickFilter(filter.key);
        setFilters((prev) => ({
            ...prev,
            type: filter.type || "",
        }));
    };

    const handleView = (location) => {
        handleLocationSelect(location);
    };

    const handleEdit = (location) => {
        setEditingLocation(location);
        setFormMode("edit");
        setFormOpen(true);
    };

    const handleDeleteRequest = (location) => {
        setLocationToDelete(location);
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        if (deleteLoading) return;
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
        setDeleteError("");
    };

    const handleConfirmDelete = async () => {
        if (!locationToDelete) return;
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await dispatch(deleteLocationThunk(locationToDelete.id)).unwrap();
            dispatch(fetchLocations({ per_page: 100, page: 1 }));
            setDeleteDialogOpen(false);
            setLocationToDelete(null);
        } catch (error) {
            console.error("Error deleting location:", error);
            setDeleteError(
                getErrorMessage(error, "Có lỗi xảy ra khi xóa địa điểm")
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingLocation(null);
        setFormMode("create");
        setFormParent(null);
        setFormOpen(true);
    };

    const handleAddChild = (parentLocation) => {
        setEditingLocation(null);
        setFormMode("create");
        setFormParent(parentLocation);
        setFormOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (formMode === "edit" && editingLocation) {
                await dispatch(
                    updateLocationThunk({
                        id: editingLocation.id,
                        locationData: formData,
                    })
                ).unwrap();
            } else {
                await dispatch(createLocationThunk(formData)).unwrap();
            }
            dispatch(fetchLocations({ per_page: 100, page: 1 }));
            setFormOpen(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            throw getErrorMessage(error, "Có lỗi xảy ra khi lưu địa điểm");
        }
    };

    return (
        <div className="location-management">
            <div className="location-management__container">
                <div className="location-management__header">
                    <div>
                        <h1 className="location-management__title">
                            Quản lý địa điểm
                        </h1>
                        <p className="location-management__subtitle">
                            Quản lý tất cả địa điểm trong hệ thống của bạn
                        </p>
                    </div>
                    <button
                        className="location-management__add-btn"
                        onClick={handleAddNew}
                    >
                        <Plus size={20} />
                        <span>Thêm địa điểm mới</span>
                    </button>
                </div>

                <div className="location-management__stats">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className={`location-management__stat location-management__stat--${item.accent}`}
                        >
                            <span className="location-management__stat-label">
                                {item.label}
                            </span>
                            <span className="location-management__stat-value">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="location-management__actions">
                    <div className="location-management__actions-left">
                        <div className="location-management__search">
                            <label htmlFor="location-search">
                                Tìm kiếm địa điểm
                            </label>
                            <div className="location-management__search-input">
                                <Search size={18} />
                                <input
                                    id="location-search"
                                    type="text"
                                    placeholder="Nhập tên địa điểm..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="location-management__quick-filters">
                            {quickFilters.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    className={`location-management__chip ${
                                        activeQuickFilter === filter.key
                                            ? "location-management__chip--active"
                                            : ""
                                    }`}
                                    onClick={() => handleQuickFilter(filter)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="location-management__sort">
                            <label htmlFor="location-sort">Sắp xếp</label>
                            <select
                                id="location-sort"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                                <option value="name-asc">Tên A-Z</option>
                                <option value="name-desc">Tên Z-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="location-management__actions-right">
                        <div className="location-management__view-toggle">
                            <button
                                className={`location-management__view-btn ${
                                    viewMode === "table"
                                        ? "location-management__view-btn--active"
                                        : ""
                                }`}
                                onClick={() => setViewMode("table")}
                                title="Xem dạng bảng"
                            >
                                <LayoutGrid size={18} />
                                <span>Bảng</span>
                            </button>
                            <button
                                className={`location-management__view-btn ${
                                    viewMode === "tree"
                                        ? "location-management__view-btn--active"
                                        : ""
                                }`}
                                onClick={() => setViewMode("tree")}
                                title="Xem dạng cây"
                            >
                                <TreePine size={18} />
                                <span>Cây</span>
                            </button>
                        </div>
                        <LocationFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={handleResetFilters}
                            allLocations={locations}
                        />
                    </div>
                </div>

                {/* Breadcrumb Navigation */}
                {(breadcrumbPath.length > 0 || selectedLocation) && (
                    <div className="location-management__breadcrumb">
                        <BreadcrumbNavigation
                            path={breadcrumbPath}
                            onNavigate={handleBreadcrumbNavigate}
                            onHomeClick={handleBreadcrumbHome}
                        />
                    </div>
                )}

                {/* Content: Table or Tree View */}
                {!loading && (
                    <>
                        {viewMode === "table" ? (
                            <LocationDataGrid
                                locations={filteredLocations}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDeleteRequest}
                            />
                        ) : (
                            <LocationTreeView
                                locations={filteredLocations}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDeleteRequest}
                                onAddChild={handleAddChild}
                                selectedLocationId={selectedLocation?.id}
                                onLocationSelect={handleLocationSelect}
                            />
                        )}
                    </>
                )}

                <div className="location-management__content">
                    <div className="location-management__locations-wrapper">
                        {loading ? (
                            <div className="location-management__loading">
                                <CircularIndeterminate />
                            </div>
                        ) : error ? (
                            <div className="location-management__empty">
                                <p style={{ color: "#dc3545" }}>
                                    {error || "Có lỗi xảy ra khi tải dữ liệu"}
                                </p>
                                <button
                                    type="button"
                                    className="location-management__reset-btn"
                                    onClick={() =>
                                        dispatch(
                                            fetchLocations({
                                                per_page: 100,
                                                page: 1,
                                            })
                                        )
                                    }
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : filteredLocations.length === 0 &&
                          locations.length === 0 ? (
                            <div className="location-management__empty">
                                <MapPin
                                    size={48}
                                    style={{
                                        marginBottom: "1rem",
                                        opacity: 0.5,
                                    }}
                                />
                                <p>Chưa có dữ liệu địa điểm.</p>
                            </div>
                        ) : filteredLocations.length === 0 ? (
                            <div className="location-management__empty">
                                <MapPin
                                    size={48}
                                    style={{
                                        marginBottom: "1rem",
                                        opacity: 0.5,
                                    }}
                                />
                                <p>
                                    Không tìm thấy địa điểm nào phù hợp với bộ
                                    lọc của bạn.
                                </p>
                                <button
                                    type="button"
                                    className="location-management__reset-btn"
                                    onClick={handleResetFilters}
                                >
                                    Reset bộ lọc
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Location Form Modal */}
                <LocationForm
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={formMode === "edit" ? editingLocation : null}
                    parentLocation={formParent}
                />

                {deleteDialogOpen && (
                    <div className="location-management__confirm-overlay">
                        <div className="location-management__confirm-modal">
                            <h3>Xóa địa điểm</h3>
                            <p>
                                Bạn có chắc chắn muốn xóa{" "}
                                <strong>
                                    {locationToDelete?.name || "địa điểm này"}
                                </strong>
                                ? Hành động này không thể hoàn tác.
                            </p>
                            {deleteError && (
                                <p className="location-management__confirm-error">
                                    {deleteError}
                                </p>
                            )}
                            <div className="location-management__confirm-actions">
                                <button
                                    type="button"
                                    className="location-management__confirm-btn location-management__confirm-btn--cancel"
                                    onClick={handleCloseDeleteDialog}
                                    disabled={deleteLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="location-management__confirm-btn location-management__confirm-btn--danger"
                                    onClick={handleConfirmDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Location;
