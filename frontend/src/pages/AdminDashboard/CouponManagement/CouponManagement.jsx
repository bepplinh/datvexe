import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axiosClient from "../../../apis/axiosClient";
import { toast } from "react-toastify";
import CouponCard from "./components/CouponCard";
import CouponFormModal from "./components/CouponFormModal";
import CircularIndeterminate from "../../../components/Loading/Loading";
import { Plus, Search, Filter } from "lucide-react";
import "./CouponManagement.scss";

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [filteredCoupons, setFilteredCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "all",
        discount_type: "",
        from_date: "",
        to_date: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [activeQuickFilter, setActiveQuickFilter] = useState("all");
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const isMountedRef = useRef(true);
    const fetchingRef = useRef(false);

    const fetchCoupons = useCallback(async (page = 1) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            setLoading(true);
            const params = {
                page,
                per_page: 20,
                sort: "created_at",
                order: "desc",
            };

            if (filters.status !== "all") {
                params.status = filters.status;
            }
            if (filters.discount_type) {
                params.discount_type = filters.discount_type;
            }
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const response = await axiosClient.get("/coupons", { params });
            const data = response.data?.data;

            if (isMountedRef.current) {
                const couponsData = data?.data || [];
                setCoupons(couponsData);
                setFilteredCoupons(couponsData);
                setCurrentPage(data?.current_page || 1);
                setTotalPages(data?.last_page || 1);
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
            if (isMountedRef.current) {
                toast.error("Không thể tải danh sách coupon. Vui lòng thử lại!");
            }
        } finally {
            fetchingRef.current = false;
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [filters.status, filters.discount_type, searchQuery]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchCoupons(1);
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchCoupons]);

    useEffect(() => {
        applyFilters();
    }, [coupons, filters, searchQuery, sortOption]);

    const stats = useMemo(() => {
        const total = coupons.length;
        const active = coupons.filter((coupon) => {
            if (!coupon.is_active) return false;
            const now = new Date();
            const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
            const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            return true;
        }).length;
        const expired = coupons.filter((coupon) => {
            const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
            return endDate && new Date() > endDate;
        }).length;
        const inactive = coupons.filter((coupon) => !coupon.is_active).length;

        return [
            {
                label: "Tổng số coupon",
                value: total,
                accent: "primary",
            },
            {
                label: "Đang hoạt động",
                value: active,
                accent: "success",
            },
            {
                label: "Hết hạn",
                value: expired,
                accent: "danger",
            },
            {
                label: "Tạm ngưng",
                value: inactive,
                accent: "warning",
            },
        ];
    }, [coupons]);

    const applyFilters = () => {
        let filtered = [...coupons];

        // Lọc theo trạng thái
        if (filters.status !== "all" && filters.status !== "") {
            filtered = filtered.filter((coupon) => {
                if (filters.status === "active") {
                    if (!coupon.is_active) return false;
                    const now = new Date();
                    const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
                    const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
                    if (startDate && now < startDate) return false;
                    if (endDate && now > endDate) return false;
                    return true;
                }
                if (filters.status === "inactive") {
                    return !coupon.is_active;
                }
                if (filters.status === "expired") {
                    const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
                    return endDate && new Date() > endDate;
                }
                return true;
            });
        }

        // Lọc theo loại giảm giá
        if (filters.discount_type !== "") {
            filtered = filtered.filter(
                (coupon) => coupon.discount_type === filters.discount_type
            );
        }

        // Lọc theo ngày tạo
        if (filters.from_date !== "") {
            filtered = filtered.filter((coupon) => {
                const couponDate = new Date(coupon.created_at);
                const fromDate = new Date(filters.from_date);
                return couponDate >= fromDate;
            });
        }

        if (filters.to_date !== "") {
            filtered = filtered.filter((coupon) => {
                const couponDate = new Date(coupon.created_at);
                const toDate = new Date(filters.to_date);
                toDate.setHours(23, 59, 59, 999);
                return couponDate <= toDate;
            });
        }

        // Tìm kiếm theo mã, mô tả
        if (searchQuery.trim() !== "") {
            const keyword = searchQuery.trim().toLowerCase();
            filtered = filtered.filter((coupon) => {
                const searchText = [
                    coupon.code,
                    coupon.description,
                    coupon.name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return searchText.includes(keyword);
            });
        }

        // Sắp xếp
        filtered.sort((a, b) => {
            if (sortOption === "code-asc") {
                return (a.code || "").localeCompare(b.code || "");
            }
            if (sortOption === "code-desc") {
                return (b.code || "").localeCompare(a.code || "");
            }
            if (sortOption === "value-desc") {
                return (b.discount_value || 0) - (a.discount_value || 0);
            }
            if (sortOption === "value-asc") {
                return (a.discount_value || 0) - (b.discount_value || 0);
            }

            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();

            if (sortOption === "oldest") {
                return dateA - dateB;
            }

            // default newest
            return dateB - dateA;
        });

        setFilteredCoupons(filtered);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            status: "all",
            discount_type: "",
            from_date: "",
            to_date: "",
        });
        setSearchQuery("");
        setActiveQuickFilter("all");
        setSortOption("newest");
    };

    const quickFilters = [
        { key: "all", label: "Tất cả", status: "all" },
        { key: "active", label: "Đang hoạt động", status: "active" },
        { key: "inactive", label: "Tạm ngưng", status: "inactive" },
        { key: "expired", label: "Hết hạn", status: "expired" },
        { key: "fixed", label: "Giảm cố định", discount_type: "fixed" },
        { key: "percentage", label: "Giảm %", discount_type: "percentage" },
    ];

    const handleQuickFilter = (filter) => {
        setActiveQuickFilter(filter.key);
        setFilters((prev) => ({
            ...prev,
            status: filter.status || prev.status,
            discount_type: filter.discount_type || prev.discount_type,
        }));
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setShowCouponForm(true);
    };

    const handleDelete = async (couponId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa coupon này?")) {
            return;
        }

        try {
            await axiosClient.delete(`/coupons/${couponId}`);
            toast.success("Xóa coupon thành công!");
            fetchCoupons(currentPage);
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Không thể xóa coupon. Vui lòng thử lại!");
        }
    };

    const handleToggleActive = async (coupon) => {
        try {
            await axiosClient.put(`/coupons/${coupon.id}`, {
                is_active: !coupon.is_active,
            });
            toast.success(
                coupon.is_active
                    ? "Đã tạm ngưng coupon"
                    : "Đã kích hoạt coupon"
            );
            fetchCoupons(currentPage);
        } catch (error) {
            console.error("Error toggling coupon:", error);
            toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại!");
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            setFormLoading(true);
            if (editingCoupon) {
                await axiosClient.put(`/coupons/${editingCoupon.id}`, formData);
                toast.success("Cập nhật coupon thành công!");
            } else {
                await axiosClient.post("/coupons", formData);
                toast.success("Tạo coupon mới thành công!");
            }
            setShowCouponForm(false);
            setEditingCoupon(null);
            fetchCoupons(currentPage);
        } catch (error) {
            console.error("Error saving coupon:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.errors ||
                "Có lỗi xảy ra. Vui lòng thử lại!";
            toast.error(
                typeof errorMessage === "string"
                    ? errorMessage
                    : "Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin!"
            );
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="coupon-management">
            <div className="coupon-management__container">
                <div className="coupon-management__header">
                    <div>
                        <h1 className="coupon-management__title">
                            Quản lý Coupon
                        </h1>
                        <p className="coupon-management__subtitle">
                            Tạo và quản lý các mã giảm giá cho khách hàng
                        </p>
                    </div>
                    <button
                        className="coupon-management__add-btn"
                        onClick={() => {
                            setEditingCoupon(null);
                            setShowCouponForm(true);
                        }}
                    >
                        <Plus size={20} />
                        <span>Tạo coupon mới</span>
                    </button>
                </div>

                <div className="coupon-management__stats">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className={`coupon-management__stat coupon-management__stat--${item.accent}`}
                        >
                            <span className="coupon-management__stat-label">
                                {item.label}
                            </span>
                            <span className="coupon-management__stat-value">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="coupon-management__actions">
                    <div className="coupon-management__actions-left">
                        <div className="coupon-management__search">
                            <label htmlFor="coupon-search">Tìm kiếm coupon</label>
                            <div className="coupon-management__search-input">
                                <Search size={18} />
                                <input
                                    id="coupon-search"
                                    type="text"
                                    placeholder="Nhập mã coupon, mô tả..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="coupon-management__quick-filters">
                            {quickFilters.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    className={`coupon-management__chip ${
                                        activeQuickFilter === filter.key
                                            ? "coupon-management__chip--active"
                                            : ""
                                    }`}
                                    onClick={() => handleQuickFilter(filter)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="coupon-management__sort">
                            <label htmlFor="coupon-sort">Sắp xếp</label>
                            <select
                                id="coupon-sort"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                                <option value="code-asc">Mã A-Z</option>
                                <option value="code-desc">Mã Z-A</option>
                                <option value="value-desc">Giá trị giảm ↓</option>
                                <option value="value-asc">Giá trị giảm ↑</option>
                            </select>
                        </div>
                    </div>

                    <div className="coupon-management__actions-right">
                        <div className="coupon-management__filters">
                            <div className="coupon-management__filter-group">
                                <label>Trạng thái</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) =>
                                        handleFilterChange({
                                            ...filters,
                                            status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Tạm ngưng</option>
                                    <option value="expired">Hết hạn</option>
                                </select>
                            </div>

                            <div className="coupon-management__filter-group">
                                <label>Loại giảm giá</label>
                                <select
                                    value={filters.discount_type}
                                    onChange={(e) =>
                                        handleFilterChange({
                                            ...filters,
                                            discount_type: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Tất cả</option>
                                    <option value="fixed">Giảm cố định</option>
                                    <option value="percentage">Giảm phần trăm</option>
                                </select>
                            </div>

                            <div className="coupon-management__filter-group">
                                <label>Từ ngày</label>
                                <input
                                    type="date"
                                    value={filters.from_date}
                                    onChange={(e) =>
                                        handleFilterChange({
                                            ...filters,
                                            from_date: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="coupon-management__filter-group">
                                <label>Đến ngày</label>
                                <input
                                    type="date"
                                    value={filters.to_date}
                                    onChange={(e) =>
                                        handleFilterChange({
                                            ...filters,
                                            to_date: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                className="coupon-management__reset-btn"
                                onClick={handleResetFilters}
                            >
                                <Filter size={16} />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="coupon-management__content">
                    {loading ? (
                        <div className="coupon-management__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : filteredCoupons.length === 0 ? (
                        <div className="coupon-management__empty">
                            <p>
                                Không tìm thấy coupon nào phù hợp với bộ lọc của
                                bạn.
                            </p>
                            <button
                                type="button"
                                className="coupon-management__reset-btn"
                                onClick={handleResetFilters}
                            >
                                Reset bộ lọc
                            </button>
                        </div>
                    ) : (
                        <div className="coupon-management__coupons">
                            {filteredCoupons.map((coupon) => (
                                <CouponCard
                                    key={coupon.id}
                                    coupon={coupon}
                                    onClick={() => setSelectedCoupon(coupon)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="coupon-management__pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => fetchCoupons(currentPage - 1)}
                        >
                            Trước
                        </button>
                        <span>
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => fetchCoupons(currentPage + 1)}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {showCouponForm && (
                <CouponFormModal
                    open={showCouponForm}
                    onClose={() => {
                        setShowCouponForm(false);
                        setEditingCoupon(null);
                    }}
                    coupon={editingCoupon}
                    onSubmit={handleFormSubmit}
                    loading={formLoading}
                />
            )}
        </div>
    );
};

export default CouponManagement;

