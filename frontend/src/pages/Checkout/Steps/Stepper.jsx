import "./Steps.scss";

function Stepper({ id, label, isActive = false, isCompleted = false, prevStepCompleted = false }) {
    return (
        <>
            {id !== 1 && (
                <div
                    className={`steps__divider ${
                        prevStepCompleted ? "steps__divider--completed" : ""
                    }`}
                ></div>
            )}
            <div
                className={`step ${isActive ? "step--active" : ""} ${
                    isCompleted ? "step--completed" : ""
                }`}
            >
                <div className="step__num">{id}</div>
                <div className="step__label">{label}</div>
            </div>
        </>
    );
}

export default Stepper;
