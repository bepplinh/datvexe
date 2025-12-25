import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { paymentService } from "../../../services/paymentService";
import { toast } from "react-toastify";
import PaymentDataGrid from "./components/PaymentDataGrid";
import PaymentFilters from "./components/PaymentFilters";
import PaymentDetailModal from "./components/PaymentDetailModal";
import CircularIndeterminate from "../../../components/Loading/Loading";
import { CreditCard, TrendingUp, DollarSign, CheckCircle } from "lucide-react";
import "./PaymentManagement.scss";

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        provider: null,
        from_date: null,
        to_date: null,
        booking_code: null,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        successCount: 0,
        successAmount: 0,
    });
    const isMountedRef = useRef(true);
    const fetchingRef = useRef(false);

    const fetchPayments = useCallback(async (page = 1) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            setLoading(true);
            const params = {
                page,
                per_page: 20,
            };

            if (filters.provider) params.provider = filters.provider;
            if (filters.from_date) params.from_date = filters.from_date;
            if (filters.to_date) params.to_date = filters.to_date;
            if (filters.booking_code) params.booking_code = filters.booking_code;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const response = await paymentService.getPayments(params);
            const data = response?.data || response;

            if (isMountedRef.current) {
                const paymentsData = data?.data || [];
                setPayments(paymentsData);
                setCurrentPage(data?.current_page || page);
                setTotalPages(data?.last_page || 1);
                setTotalItems(data?.total || 0);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            if (isMountedRef.current) {
                toast.error("Không thể tải danh sách thanh toán. Vui lòng thử lại!");
            }
        } finally {
            fetchingRef.current = false;
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [filters, searchQuery]);

    const fetchStats = useCallback(async () => {
        try {
            const params = {};
            if (filters.from_date) params.from_date = filters.from_date;
            if (filters.to_date) params.to_date = filters.to_date;

            const response = await paymentService.getPaymentStats(params);
            const data = response?.data || response;

            if (isMountedRef.current) {
                setStats({
                    total: data?.total || 0,
                    totalAmount: data?.total_amount || 0,
                    successCount: data?.success_count || 0,
                    successAmount: data?.success_amount || 0,
                });
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }, [filters.from_date, filters.to_date]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchPayments(1);
        fetchStats();
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchPayments, fetchStats]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setFilters({
            provider: null,
            from_date: null,
            to_date: null,
            booking_code: null,
        });
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handleViewPayment = async (payment) => {
        try {
            const response = await paymentService.getPaymentById(payment.id);
            const paymentData = response?.data || response;
            setSelectedPayment(paymentData);
        } catch (error) {
            console.error("Error fetching payment details:", error);
            toast.error("Không thể tải chi tiết thanh toán. Vui lòng thử lại!");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    const statsCards = useMemo(
        () => [
            {
                label: "Tổng số giao dịch",
                value: stats.total,
                icon: CreditCard,
                accent: "primary",
            },
            {
                label: "Tổng doanh thu",
                value: formatCurrency(stats.totalAmount),
                icon: DollarSign,
                accent: "success",
            },
            {
                label: "Giao dịch thành công",
                value: stats.successCount,
                icon: CheckCircle,
                accent: "success",
            },
            {
                label: "Doanh thu thành công",
                value: formatCurrency(stats.successAmount),
                icon: TrendingUp,
                accent: "info",
            },
        ],
        [stats]
    );

    return (
        <div className="payment-management">
            <div className="payment-management__container">
                <div className="payment-management__header">
                    <div>
                        <h1 className="payment-management__title">
                            Quản lý thanh toán
                        </h1>
                        <p className="payment-management__subtitle">
                            Theo dõi và quản lý tất cả các giao dịch thanh toán
                        </p>
                    </div>
                </div>

                <div className="payment-management__stats">
                    {statsCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className={`payment-management__stat payment-management__stat--${stat.accent}`}
                            >
                                <div className="payment-management__stat-icon">
                                    <Icon size={24} />
                                </div>
                                <div className="payment-management__stat-content">
                                    <span className="payment-management__stat-label">
                                        {stat.label}
                                    </span>
                                    <span className="payment-management__stat-value">
                                        {stat.value}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <PaymentFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <div className="payment-management__content">
                    {loading && payments.length === 0 ? (
                        <div className="payment-management__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="payment-management__empty">
                            <p>Không tìm thấy giao dịch thanh toán nào.</p>
                            <button
                                type="button"
                                className="payment-management__reset-btn"
                                onClick={handleResetFilters}
                            >
                                Reset bộ lọc
                            </button>
                        </div>
                    ) : (
                        <>
                            <PaymentDataGrid
                                payments={payments}
                                onView={handleViewPayment}
                                loading={loading}
                            />
                            {totalPages > 1 && (
                                <div className="payment-management__pagination">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => fetchPayments(currentPage - 1)}
                                    >
                                        Trước
                                    </button>
                                    <span>
                                        Trang {currentPage} / {totalPages} ({totalItems} giao dịch)
                                    </span>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => fetchPayments(currentPage + 1)}
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedPayment && (
                <PaymentDetailModal
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                    onRefundSuccess={() => {
                        // Reload payments after refund
                        fetchPayments(currentPage);
                        fetchStats();
                    }}
                />
            )}
        </div>
    );
};

export default PaymentManagement;

