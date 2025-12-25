import React from "react";
import { Search, Filter, X } from "lucide-react";
import "./PaymentFilters.scss";

const PaymentFilters = ({
    filters,
    onFilterChange,
    onReset,
    searchQuery,
    onSearchChange,
}) => {
    const providers = [
        { value: "", label: "Tất cả" },
        { value: "payos", label: "PayOS" },
        { value: "vnpay", label: "VNPay" },
        { value: "momo", label: "MoMo" },
        { value: "cash", label: "Tiền mặt" },
        { value: "bank_transfer", label: "Chuyển khoản" },
    ];

    return (
        <div className="payment-filters">
            <div className="payment-filters__search">
                <label htmlFor="payment-search">Tìm kiếm</label>
                <div className="payment-filters__search-input">
                    <Search size={18} />
                    <input
                        id="payment-search"
                        type="text"
                        placeholder="Mã đặt vé, mã giao dịch, tên khách hàng..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="payment-filters__clear-search"
                            onClick={() => onSearchChange("")}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="payment-filters__group">
                <div className="payment-filters__filter-item">
                    <label>Phương thức thanh toán</label>
                    <select
                        value={filters.provider || ""}
                        onChange={(e) =>
                            onFilterChange({
                                ...filters,
                                provider: e.target.value || null,
                            })
                        }
                    >
                        {providers.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                                {provider.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="payment-filters__filter-item">
                    <label>Mã đặt vé</label>
                    <input
                        type="text"
                        placeholder="Nhập mã đặt vé..."
                        value={filters.booking_code || ""}
                        onChange={(e) =>
                            onFilterChange({
                                ...filters,
                                booking_code: e.target.value || null,
                            })
                        }
                    />
                </div>

                <div className="payment-filters__filter-item">
                    <label>Từ ngày</label>
                    <input
                        type="date"
                        value={filters.from_date || ""}
                        onChange={(e) =>
                            onFilterChange({
                                ...filters,
                                from_date: e.target.value || null,
                            })
                        }
                    />
                </div>

                <div className="payment-filters__filter-item">
                    <label>Đến ngày</label>
                    <input
                        type="date"
                        value={filters.to_date || ""}
                        onChange={(e) =>
                            onFilterChange({
                                ...filters,
                                to_date: e.target.value || null,
                            })
                        }
                    />
                </div>

                <button
                    type="button"
                    className="payment-filters__reset-btn"
                    onClick={onReset}
                >
                    <Filter size={16} />
                    <span>Reset</span>
                </button>
            </div>
        </div>
    );
};

export default PaymentFilters;

