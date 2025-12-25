import { useEffect, useState } from "react";
import { ratingService } from "../../services/ratingService";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-toastify";
import "./RatingPrompt.scss";

const SKIP_IDS_KEY = "rating_prompt_skipped_ids"; // lưu danh sách trip_id đã bỏ qua

const StarInput = ({ value, onChange }) => {
    return (
        <div className="rp-stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`rp-star ${star <= value ? "active" : ""}`}
                    onClick={() => onChange(star)}
                    aria-label={`Chọn ${star} sao`}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

const RatingPrompt = () => {
    const { user } = useAuth();
    const [pending, setPending] = useState([]);
    const [open, setOpen] = useState(false);
    const [score, setScore] = useState();
    const [comment, setComment] = useState("");
    const [current, setCurrent] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [skippedIds, setSkippedIds] = useState(() => {
        try {
            const raw = localStorage.getItem(SKIP_IDS_KEY);
            if (!raw) return [];
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    });

    const loadPending = async () => {
        if (!user) {
            return;
        }
        try {
            const list = await ratingService.getPending();

            // Lọc bỏ các trip đã skip
            const skipSet = new Set(skippedIds);
            const filtered = (list || []).filter((p) => !skipSet.has(p.trip_id));

            setPending(filtered);
            if (filtered.length) {
                setCurrent(filtered[0]);
                setOpen(true);
            }
        } catch (err) {
            console.error("Load pending ratings failed", err);
        }
    };

    useEffect(() => {
        loadPending();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSubmit = async () => {
        if (!current) return;
        if (!score) {
            toast.warn("Vui lòng chọn số sao");
            return;
        }
        try {
            setSubmitting(true);
            await ratingService.submitRating({
                tripId: current.trip_id,
                payload: { score, comment: comment?.trim() || null },
            });
            toast.success("Đã gửi đánh giá");
            const rest = pending.filter((p) => p.trip_id !== current.trip_id);
            setPending(rest);
            setComment("");
            setScore(5);
            const next = rest[0];
            setCurrent(next || null);
            if (!next) setOpen(false);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                "Gửi đánh giá thất bại, vui lòng thử lại";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        if (!current) {
            setOpen(false);
            return;
        }
        const nextSkipped = Array.from(new Set([...skippedIds, current.trip_id]));
        setSkippedIds(nextSkipped);
        localStorage.setItem(SKIP_IDS_KEY, JSON.stringify(nextSkipped));
        const rest = pending.filter((p) => p.trip_id !== current.trip_id);
        setPending(rest);
        const next = rest[0];
        setCurrent(next || null);
        if (!next) setOpen(false);
    };

    if (!open || !current) return null;

    return (
        <div className="rp-backdrop">
            <div className="rp-modal">
                <div className="rp-header">
                    <div>
                        <p className="rp-label">Đánh giá chuyến đi</p>
                        <h3>
                            {current.route_name ||
                                `${current.from_location || "Điểm đi"} → ${current.to_location || "Điểm đến"
                                }`}
                        </h3>
                        <p className="rp-sub">
                            Điểm đi: {current.from_location || "—"} • Điểm đến:{" "}
                            {current.to_location || "—"}
                        </p>
                        <p className="rp-sub">
                            Khởi hành: {new Date(current.departure_time).toLocaleString()} • Đến
                            dự kiến: {new Date(current.arrival_estimate).toLocaleString()}
                        </p>
                    </div>
                    <button className="rp-close" onClick={handleSkip} aria-label="Đóng">
                        ×
                    </button>
                </div>

                <div className="rp-body">
                    <StarInput value={score} onChange={setScore} />
                    <textarea
                        className="rp-textarea"
                        placeholder="Chia sẻ trải nghiệm của bạn (tùy chọn)"
                        value={comment}
                        maxLength={500}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="rp-meta">
                        <span>{comment.length}/500</span>
                    </div>
                </div>

                <div className="rp-footer">
                    <button className="rp-btn ghost" onClick={handleSkip} disabled={submitting}>
                        Bỏ qua
                    </button>
                    <button className="rp-btn primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingPrompt;

