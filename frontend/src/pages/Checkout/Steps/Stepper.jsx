import "./Steps.scss"

function Stepper({ id, label }) {
    return (
        <>
            {id !== 1 && <div className="steps__divider"></div>}
            <div className={`step ${id === 1 ? "step--active" : ""}`}>
                <div className="step__num">{id}</div>
                <div className="step__label">{label}</div>
            </div>
        </>
    )
}

export default Stepper;
