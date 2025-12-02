import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchBusTypes,
    createBusType as createBusTypeThunk,
    updateBusType as updateBusTypeThunk,
    deleteBusType as deleteBusTypeThunk,
} from "../../../store/slices/busTypeSlice";
import { Bus, Search, Plus } from "lucide-react";
import BusTypeDataGrid from "./components/BusTypeDataGrid";
import BusTypeForm from "./components/BusTypeForm";
import CircularIndeterminate from "../../../components/Loading/Loading";
import "./BusType.scss";
import { getErrorMessage } from "../../../utils/error";

const BusType = () => {
    const dispatch = useAppDispatch();
    const { busTypes, loading, error } = useAppSelector(
        (state) => state.busType
    );

    const [filteredBusTypes, setFilteredBusTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [editingBusType, setEditingBusType] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create"); // "create" or "edit"
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [busTypeToDelete, setBusTypeToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Gọi API khi component mount
    useEffect(() => {
        dispatch(fetchBusTypes());
    }, [dispatch]);


    // Lọc và sắp xếp bus types
    useEffect(() => {
        let filtered = [...busTypes];

        // Tìm kiếm theo tên
        if (searchQuery.trim() !== "") {
            const keyword = searchQuery.trim().toLowerCase();
            filtered = filtered.filter((bt) => {
                const searchText = (bt.name || "").toLowerCase();
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
            if (sortOption === "seats-asc") {
                return (a.seat_count || 0) - (b.seat_count || 0);
            }
            if (sortOption === "seats-desc") {
                return (b.seat_count || 0) - (a.seat_count || 0);
            }

            const dateA = new Date(a.created_at || a.createdAt).getTime();
            const dateB = new Date(b.created_at || b.createdAt).getTime();

            if (sortOption === "oldest") {
                return dateA - dateB;
            }

            // default newest
            return dateB - dateA;
        });

        setFilteredBusTypes(filtered);
    }, [busTypes, searchQuery, sortOption]);

    const handleEdit = (busType) => {
        setEditingBusType(busType);
        setFormMode("edit");
        setFormOpen(true);
    };

    const handleDeleteRequest = (busType) => {
        setBusTypeToDelete(busType);
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        if (deleteLoading) return;
        setDeleteDialogOpen(false);
        setBusTypeToDelete(null);
        setDeleteError("");
    };

    const handleConfirmDelete = async () => {
        if (!busTypeToDelete) return;
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await dispatch(deleteBusTypeThunk(busTypeToDelete.id)).unwrap();
            dispatch(fetchBusTypes());
            setDeleteDialogOpen(false);
            setBusTypeToDelete(null);
        } catch (error) {
            console.error("Error deleting bus type:", error);
            setDeleteError(
                getErrorMessage(error, "Có lỗi xảy ra khi xóa loại xe")
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingBusType(null);
        setFormMode("create");
        setFormOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (formMode === "edit" && editingBusType) {
                await dispatch(
                    updateBusTypeThunk({
                        id: editingBusType.id,
                        busTypeData: formData,
                    })
                ).unwrap();
            } else {
                await dispatch(createBusTypeThunk(formData)).unwrap();
            }
            dispatch(fetchBusTypes());
            setFormOpen(false);
        } catch (error) {
            console.error("Error submitting form:", error);
            throw getErrorMessage(error, "Có lỗi xảy ra khi lưu loại xe");
        }
    };

    return (
        <div className="bus-type-management">
            <div className="bus-type-management__container">
                <div className="bus-type-management__header">
                    <div>
                        <h1 className="bus-type-management__title">
                            Quản lý loại xe
                        </h1>
                        <p className="bus-type-management__subtitle">
                            Quản lý tất cả loại xe trong hệ thống của bạn
                        </p>
                    </div>
                    <button
                        className="bus-type-management__add-btn"
                        onClick={handleAddNew}
                    >
                        <Plus size={20} />
                        <span>Thêm loại xe mới</span>
                    </button>
                </div>


                <div className="bus-type-management__actions">
                    <div className="bus-type-management__actions-left">
                        <div className="bus-type-management__search">
                            <label htmlFor="bus-type-search">
                                Tìm kiếm loại xe
                            </label>
                            <div className="bus-type-management__search-input">
                                <Search size={18} />
                                <input
                                    id="bus-type-search"
                                    type="text"
                                    placeholder="Nhập tên loại xe..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="bus-type-management__sort">
                            <label htmlFor="bus-type-sort">Sắp xếp</label>
                            <select
                                id="bus-type-sort"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
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

                {/* Content */}
                <div className="bus-type-management__content">
                    <div className="bus-type-management__bus-types-wrapper">
                        {loading ? (
                            <div className="bus-type-management__loading">
                                <CircularIndeterminate />
                            </div>
                        ) : error ? (
                            <div className="bus-type-management__empty">
                                <p style={{ color: "#dc3545" }}>
                                    {error || "Có lỗi xảy ra khi tải dữ liệu"}
                                </p>
                                <button
                                    type="button"
                                    className="bus-type-management__reset-btn"
                                    onClick={() => dispatch(fetchBusTypes())}
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : filteredBusTypes.length === 0 &&
                          busTypes.length === 0 ? (
                            <div className="bus-type-management__empty">
                                <Bus
                                    size={48}
                                    style={{
                                        marginBottom: "1rem",
                                        opacity: 0.5,
                                    }}
                                />
                                <p>Chưa có dữ liệu loại xe.</p>
                            </div>
                        ) : filteredBusTypes.length === 0 ? (
                            <div className="bus-type-management__empty">
                                <Bus
                                    size={48}
                                    style={{
                                        marginBottom: "1rem",
                                        opacity: 0.5,
                                    }}
                                />
                                <p>
                                    Không tìm thấy loại xe nào phù hợp với bộ
                                    lọc của bạn.
                                </p>
                                <button
                                    type="button"
                                    className="bus-type-management__reset-btn"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSortOption("newest");
                                    }}
                                >
                                    Reset bộ lọc
                                </button>
                            </div>
                        ) : (
                            <BusTypeDataGrid
                                busTypes={filteredBusTypes}
                                onEdit={handleEdit}
                                onDelete={handleDeleteRequest}
                            />
                        )}
                    </div>
                </div>

                {/* BusType Form Modal */}
                <BusTypeForm
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={formMode === "edit" ? editingBusType : null}
                />

                {deleteDialogOpen && (
                    <div className="bus-type-management__confirm-overlay">
                        <div className="bus-type-management__confirm-modal">
                            <h3>Xóa loại xe</h3>
                            <p>
                                Bạn có chắc chắn muốn xóa{" "}
                                <strong>
                                    {busTypeToDelete?.name || "loại xe này"}
                                </strong>
                                ? Hành động này không thể hoàn tác.
                            </p>
                            {deleteError && (
                                <p className="bus-type-management__confirm-error">
                                    {deleteError}
                                </p>
                            )}
                            <div className="bus-type-management__confirm-actions">
                                <button
                                    type="button"
                                    className="bus-type-management__confirm-btn bus-type-management__confirm-btn--cancel"
                                    onClick={handleCloseDeleteDialog}
                                    disabled={deleteLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="bus-type-management__confirm-btn bus-type-management__confirm-btn--danger"
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

export default BusType;

