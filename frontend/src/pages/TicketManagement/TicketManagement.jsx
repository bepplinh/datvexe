import React, { useState, useEffect, useMemo } from "react";
import axiosClient from "../../apis/axiosClient";
import { toast } from "react-toastify";
import TicketCard from "./components/TicketCard";
import TicketFilters from "./components/TicketFilters";
import CircularIndeterminate from "../../components/Loading/Loading";
import TicketDetailModal from "./components/TicketDetailModal";
import "./TicketManagement.scss";

const TicketManagement = () => {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        payment_status: "",
        ticket_status: "",
        from_date: "",
        to_date: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [activeQuickFilter, setActiveQuickFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tickets, filters, searchQuery, sortOption]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get("/bookings");
            console.log(response);

            const bookings = response.data?.data?.data || [];

            const formattedTickets = bookings.map((booking) => {
                const firstLeg = booking.legs?.[0];
                const departureTime = firstLeg?.trip?.departure_time || null;

                return {
                    id: booking.id,
                    code: booking.code,
                    from:
                        firstLeg?.pickup_address ||
                        booking.origin_location ||
                        "Điểm đi",
                    to:
                        firstLeg?.dropoff_address ||
                        booking.destination_location ||
                        "Điểm đến",
                    departure_date: departureTime
                        ? departureTime.slice(0, 10)
                        : null,
                    departure_time: departureTime
                        ? departureTime.slice(11, 16)
                        : null,
                    bus_type:
                        firstLeg?.trip?.bus?.type_name ||
                        firstLeg?.trip?.bus?.name ||
                        "GIƯỜNG NẰM",
                    payment_status:
                        booking.status === "paid" ? "paid" : "unpaid",
                    ticket_status:
                        booking.status === "cancelled"
                            ? "cancelled"
                            : "not-departed",
                    price: booking.total_price || 0,
                    raw: booking, // giữ booking gốc để modal dùng
                };
            });

            setTickets(formattedTickets);
            setFilteredTickets(formattedTickets);
            console.log("Tickets:", formattedTickets);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error("Không thể tải danh sách vé. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = tickets.length;
        const paid = tickets.filter(
            (ticket) => ticket.payment_status === "paid"
        ).length;
        const upcoming = tickets.filter(
            (ticket) => ticket.ticket_status === "not-departed"
        ).length;
        const cancelled = tickets.filter(
            (ticket) => ticket.ticket_status === "cancelled"
        ).length;

        return [
            {
                label: "Tổng số vé",
                value: total,
                accent: "primary",
            },
            {
                label: "Đã thanh toán",
                value: paid,
                accent: "success",
            },
            {
                label: "Sắp khởi hành",
                value: upcoming,
                accent: "info",
            },
            {
                label: "Đã hủy",
                value: cancelled,
                accent: "danger",
            },
        ];
    }, [tickets]);

    const applyFilters = () => {
        let filtered = [...tickets];

        // Lọc theo trạng thái thanh toán
        if (filters.payment_status !== "") {
            filtered = filtered.filter((ticket) => {
                if (filters.payment_status === "paid") {
                    return (
                        ticket.payment_status === "paid" ||
                        ticket.payment_status === "Đã thanh toán"
                    );
                }
                if (filters.payment_status === "unpaid") {
                    return (
                        ticket.payment_status === "unpaid" ||
                        ticket.payment_status === "Chưa thanh toán"
                    );
                }
                return true;
            });
        }

        // Lọc theo tình trạng vé
        if (filters.ticket_status !== "") {
            filtered = filtered.filter((ticket) => {
                if (filters.ticket_status === "departed") {
                    return (
                        ticket.ticket_status === "departed" ||
                        ticket.ticket_status === "Đã đi"
                    );
                }
                if (filters.ticket_status === "not-departed") {
                    return (
                        ticket.ticket_status === "not-departed" ||
                        ticket.ticket_status === "Chưa đi"
                    );
                }
                if (filters.ticket_status === "cancelled") {
                    return (
                        ticket.ticket_status === "cancelled" ||
                        ticket.ticket_status === "Đã hủy"
                    );
                }
                return true;
            });
        }

        // Lọc theo ngày đi
        if (filters.from_date !== "") {
            filtered = filtered.filter((ticket) => {
                const ticketDate = new Date(ticket.departure_date);
                const fromDate = new Date(filters.from_date);
                return ticketDate >= fromDate;
            });
        }

        if (filters.to_date !== "") {
            filtered = filtered.filter((ticket) => {
                const ticketDate = new Date(ticket.departure_date);
                const toDate = new Date(filters.to_date);
                toDate.setHours(23, 59, 59, 999); // Include the entire day
                return ticketDate <= toDate;
            });
        }

        // Tìm kiếm theo mã vé / tuyến / xe
        if (searchQuery.trim() !== "") {
            const keyword = searchQuery.trim().toLowerCase();
            filtered = filtered.filter((ticket) => {
                const target =
                    [ticket.code, ticket.from, ticket.to, ticket.bus_type]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase() || "";

                return target.includes(keyword);
            });
        }

        // Sắp xếp
        filtered.sort((a, b) => {
            if (sortOption === "price-desc") {
                return (b.price || 0) - (a.price || 0);
            }
            if (sortOption === "price-asc") {
                return (a.price || 0) - (b.price || 0);
            }

            const dateA = new Date(
                `${a.departure_date || ""} ${a.departure_time || ""}`
            ).getTime();
            const dateB = new Date(
                `${b.departure_date || ""} ${b.departure_time || ""}`
            ).getTime();

            if (sortOption === "oldest") {
                return dateA - dateB;
            }

            // default newest
            return dateB - dateA;
        });

        setFilteredTickets(filtered);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            payment_status: "",
            ticket_status: "",
            from_date: "",
            to_date: "",
        });
    };

    const quickFilters = [
        { key: "all", label: "Tất cả", status: "" },
        { key: "upcoming", label: "Chưa đi", status: "not-departed" },
        { key: "departed", label: "Đã đi", status: "departed" },
        { key: "cancelled", label: "Đã hủy", status: "cancelled" },
    ];

    const handleQuickFilter = (filter) => {
        setActiveQuickFilter(filter.key);
        setFilters((prev) => ({
            ...prev,
            ticket_status: filter.status,
        }));
    };

    return (
        <div className="ticket-management">
            <div className="ticket-management__container">
                <h1 className="ticket-management__title">Quản lý vé của tôi</h1>
                <p className="ticket-management__subtitle">
                    Theo dõi trạng thái vé, lịch trình và thông tin thanh toán
                    của bạn trong một nơi duy nhất
                </p>

                <div className="ticket-management__stats">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className={`ticket-management__stat ticket-management__stat--${item.accent}`}
                        >
                            <span className="ticket-management__stat-label">
                                {item.label}
                            </span>
                            <span className="ticket-management__stat-value">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="ticket-management__actions">
                    <div className="ticket-management__search">
                        <label htmlFor="ticket-search">Tìm kiếm vé</label>
                        <div className="ticket-management__search-input">
                            <input
                                id="ticket-search"
                                type="text"
                                placeholder="Nhập mã vé, tuyến đường hoặc loại xe..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="ticket-management__quick-filters">
                        {quickFilters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                className={`ticket-management__chip ${
                                    activeQuickFilter === filter.key
                                        ? "ticket-management__chip--active"
                                        : ""
                                }`}
                                onClick={() => handleQuickFilter(filter)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="ticket-management__sort">
                        <label htmlFor="ticket-sort">Sắp xếp</label>
                        <select
                            id="ticket-sort"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="price-desc">Giá cao → thấp</option>
                            <option value="price-asc">Giá thấp → cao</option>
                        </select>
                    </div>
                </div>

                <div className="ticket-management__content">
                    <div className="ticket-management__filters">
                        <TicketFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={handleResetFilters}
                        />
                    </div>

                    <div className="ticket-management__tickets-wrapper">
                        {loading ? (
                            <div className="ticket-management__loading">
                                <CircularIndeterminate />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="ticket-management__empty">
                                <p>
                                    Không tìm thấy vé nào phù hợp với bộ lọc của
                                    bạn.
                                </p>
                                <button
                                    type="button"
                                    className="ticket-management__reset-btn"
                                    onClick={() => {
                                        setFilters({
                                            payment_status: "",
                                            ticket_status: "",
                                            from_date: "",
                                            to_date: "",
                                        });
                                        setSearchQuery("");
                                        setActiveQuickFilter("all");
                                        setSortOption("newest");
                                    }}
                                >
                                    Reset bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="ticket-management__tickets">
                                {filteredTickets.map((ticket) => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        onClick={() =>
                                            setSelectedTicket(ticket)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

export default TicketManagement;
