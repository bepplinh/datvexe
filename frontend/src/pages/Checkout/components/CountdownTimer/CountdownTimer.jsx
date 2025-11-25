import { useState, useEffect, useRef } from "react";
import "./CountdownTimer.scss";

function CountdownTimer({ expiresAt, onExpired }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);
    const onExpiredRef = useRef(onExpired);
    const hasCalledExpiredRef = useRef(false);

    // Cập nhật ref khi onExpired thay đổi
    useEffect(() => {
        onExpiredRef.current = onExpired;
    }, [onExpired]);

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft(null);
            hasCalledExpiredRef.current = false;
            return;
        }

        // Reset flag khi expiresAt thay đổi
        hasCalledExpiredRef.current = false;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const difference = expiry - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft({ minutes: 0, seconds: 0 });
                // Chỉ gọi onExpired một lần
                if (!hasCalledExpiredRef.current && onExpiredRef.current) {
                    hasCalledExpiredRef.current = true;
                    onExpiredRef.current();
                }
                return null;
            }

            const minutes = Math.floor(
                (difference % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            return { minutes, seconds };
        };

        const initialTime = calculateTimeLeft();
        setTimeLeft(initialTime);

        const interval = setInterval(() => {
            const time = calculateTimeLeft();
            if (time === null) {
                clearInterval(interval);
            } else {
                setTimeLeft(time);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt || !timeLeft) {
        return null;
    }

    if (isExpired) {
        return (
            <div className="countdown-timer countdown-timer--expired">
                <div className="countdown-timer__icon">⏰</div>
                <div className="countdown-timer__text">
                    <div className="countdown-timer__label">
                        Thời gian giữ chỗ đã hết hạn
                    </div>
                </div>
            </div>
        );
    }

    const formatTime = (value) => String(value).padStart(2, "0");

    return (
        <div className="countdown-timer">
            <div className="countdown-timer__icon">⏱️</div>
            <div className="countdown-timer__text">
                <div className="countdown-timer__label">
                    Thời gian giữ chỗ còn lại
                </div>
                <div className="countdown-timer__time">
                    {formatTime(timeLeft.minutes)}:
                    {formatTime(timeLeft.seconds)}
                </div>
            </div>
        </div>
    );
}

export default CountdownTimer;
