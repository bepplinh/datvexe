import { useEffect, useMemo, useState } from "react";
import { adminRatingService } from "../../../services/admin/ratingService";
import "./RatingManagement.scss";

const defaultFilter = {
    date_from: "",
    date_to: "",
    score: "", // lọc đúng một mức sao (1-5)
    has_comment: false,
    low_score_only: false,
    search: "",
    sort: "created_desc",
    page: 1,
    per_page: 20,
};

const RatingManagement = () => {
    const [filter, setFilter] = useState(defaultFilter);
    const [data, setData] = useState({ data: [], meta: {} });
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    const queryParams = useMemo(() => {
        const params = { ...filter };
        Object.keys(params).forEach((k) => {
            if (params[k] === "" || params[k] === null) delete params[k];
        });
        return params;
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await adminRatingService.list(queryParams);
            setData(res);
            const sum = await adminRatingService.summary({
                date_from: filter.date_from,
                date_to: filter.date_to,
            });
            setSummary(sum);
        } catch (err) {
            console.error("Load ratings failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    const handleChange = (name, value) => {
        setFilter((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePage = (page) => {
        setFilter((prev) => ({ ...prev, page }));
    };

    return (
        <div className="rating-admin">
            <div className="ra-top">
                <div className="ra-filters">
                    <div className="f-item f-item-search">
                        <label>Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="Tìm theo bình luận, tên khách, email, tuyến..."
                            value={filter.search}
                            onChange={(e) => handleChange("search", e.target.value)}
                        />
                    </div>
                    <div className="f-item">
                        <label>Từ ngày</label>
                        <input
                            type="date"
                            value={filter.date_from}
                            onChange={(e) =>
                                handleChange("date_from", e.target.value)
                            }
                        />
                    </div>
                    <div className="f-item">
                        <label>Đến ngày</label>
                        <input
                            type="date"
                            value={filter.date_to}
                            onChange={(e) =>
                                handleChange("date_to", e.target.value)
                            }
                        />
                    </div>
                    <div className="f-item">
                        <label>Điểm sao</label>
                        <select
                            value={filter.score}
                            onChange={(e) =>
                                handleChange("score", e.target.value)
                            }
                        >
                            <option value="">Tất cả</option>
                            {[5, 4, 3, 2, 1].map((s) => (
                                <option key={s} value={s}>
                                    {s} sao
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="f-item checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={filter.has_comment}
                                onChange={(e) =>
                                    handleChange(
                                        "has_comment",
                                        e.target.checked
                                    )
                                }
                            />
                            Chỉ có bình luận
                        </label>
                    </div>
                    <div className="f-item checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={filter.low_score_only}
                                onChange={(e) =>
                                    handleChange(
                                        "low_score_only",
                                        e.target.checked
                                    )
                                }
                            />
                            Ưu tiên điểm thấp (≤3)
                        </label>
                    </div>
                    <div className="f-item">
                        <label>Sắp xếp</label>
                        <select
                            value={filter.sort}
                            onChange={(e) =>
                                handleChange("sort", e.target.value)
                            }
                        >
                            <option value="created_desc">Mới nhất</option>
                            <option value="score_desc">Điểm cao → thấp</option>
                            <option value="score_asc">Điểm thấp → cao</option>
                        </select>
                    </div>
                </div>

                {summary && <SummaryCard summary={summary} />}
            </div>

            <div className="ra-table">
                <div className="ra-thead">
                    <div>Thời gian đánh giá</div>
                    <div>Điểm</div>
                    <div>Tuyến / Hành trình</div>
                    <div>Khách</div>
                    <div>Bình luận</div>
                </div>
                {loading ? (
                    <SkeletonRows />
                ) : (data.data || []).length === 0 ? (
                    <div className="ra-row empty">Không có dữ liệu</div>
                ) : (
                    (data.data || []).map((item) => (
                        <div className="ra-row" key={item.id}>
                            <div className="ra-rating-time">
                                <div className="ra-time-strong">
                                    {new Date(
                                        item.created_at
                                    ).toLocaleDateString()}
                                </div>
                                <div className="ra-time-sub">
                                    {new Date(
                                        item.created_at
                                    ).toLocaleTimeString()}
                                </div>
                            </div>
                            <div className={`ra-score score-${item.score}`}>
                                <span>{item.score} ★</span>
                                {item.comment ? (
                                    <span className="badge">Có bình luận</span>
                                ) : null}
                            </div>
                            <div>
                                <div className="ra-route">
                                    {item.pickup_location || item.from_location}{" "}
                                    →{" "}
                                    {item.dropoff_location || item.to_location}
                                </div>
                                {item.departure_time && (
                                    <div className="ra-time">
                                        Khởi hành:{" "}
                                        {new Date(
                                            item.departure_time
                                        ).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="ra-user">
                                    {item.user?.name || "Ẩn danh"}
                                </div>
                                <div className="ra-user-sub">
                                    {item.user?.email
                                        ? maskEmail(item.user.email)
                                        : ""}
                                </div>
                            </div>
                            <div className="ra-comment">
                                {item.comment ? (
                                    truncate(item.comment, 160)
                                ) : (
                                    <i>Không có</i>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="ra-pagination">
                <button
                    disabled={!data?.prev_page_url || filter.page <= 1}
                    onClick={() => handlePage(filter.page - 1)}
                >
                    Trước
                </button>
                <span>
                    Trang {data?.current_page || filter.page} /{" "}
                    {data?.last_page || 1}
                </span>
                <button
                    disabled={
                        !data?.next_page_url ||
                        (data?.current_page || 1) >= (data?.last_page || 1)
                    }
                    onClick={() => handlePage(filter.page + 1)}
                >
                    Tiếp
                </button>
            </div>
        </div>
    );
};

function truncate(str = "", len = 140) {
    if (str.length <= len) return str;
    return str.slice(0, len) + "…";
}

function maskEmail(email = "") {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    const masked = user.length > 2 ? user[0] + "***" + user.slice(-1) : "***";
    return `${masked}@${domain}`;
}

const SummaryCard = ({ summary }) => {
    const dist = summary.distribution || {};
    const total = summary.count || 0;
    const items = [5, 4, 3, 2, 1].map((k) => ({
        score: k,
        total: dist[k] || 0,
        pct: total ? Math.round(((dist[k] || 0) / total) * 100) : 0,
    }));

    return (
        <div className="ra-summary">
            <div className="ra-summary-left">
                <div>
                    <span>Điểm TB</span>
                    <strong>{summary.average ?? 0}</strong>
                </div>
                <div>
                    <span>Tổng</span>
                    <strong>{summary.count ?? 0}</strong>
                </div>
            </div>
            <div className="ra-dist">
                {items.map((it) => (
                    <div key={it.score} className="ra-dist-row">
                        <span>{it.score}★</span>
                        <div className="ra-dist-bar">
                            <div style={{ width: `${it.pct}%` }} />
                        </div>
                        <span>{it.total}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SkeletonRows = () => {
    return (
        <>
            {[...Array(3)].map((_, idx) => (
                <div className="ra-row skeleton" key={idx}>
                    <div className="sk-block short" />
                    <div className="sk-block short" />
                    <div className="sk-block long" />
                    <div className="sk-block" />
                    <div className="sk-block long" />
                </div>
            ))}
        </>
    );
};

export default RatingManagement;
