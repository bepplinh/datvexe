import "./test.scss";

const data = [
    { label: "Tuyen", detail: "Thuong tin" },
    { label: "Chang", detail: "Tho tin" },
    { label: "Thoi gian", detail: "Xuan tin" },
];

function Test() {
    return (
        <>
            <div className="container_test">
                <h2>Chiều đi</h2>
                {data.map((item, index) => (
                    <div className="row" key={index}>
                        <div className="row__label">
                            <span>{item.label}:</span>
                        </div>
                        <div className="row__detail">
                            <span> {item.detail}</span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
export default Test;
