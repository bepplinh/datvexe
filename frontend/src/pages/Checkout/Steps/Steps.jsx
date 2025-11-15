import Stepper from "./Stepper";
import "./Steps.scss"

const dataSteps = [
    {
        id: 1,
        label: "Thông tin"
    },
    {
        id: 2,
        label: "Thanh toán"
    },
    {
        id: 3,
        label: "Xác nhận"
    },
];
function Steps() {
    return (
        <div className="steps">
            {dataSteps.map((item) => (
                <Stepper key={item.id} id={item.id} label={item.label}></Stepper>
            ))}
        </div>
    )
}

export default Steps;
