import Stepper from "./Stepper";
import "./Steps.scss";
import { useCheckout } from "../../../contexts/CheckoutProvider";

const dataSteps = [
    {
        id: 1,
        label: "Thông tin",
    },
    {
        id: 2,
        label: "Thanh toán",
    },
    {
        id: 3,
        label: "Xác nhận",
    },
];

function Steps() {
    const { currentStep } = useCheckout();

    return (
        <div className="steps">
            {dataSteps.map((item) => (
                <Stepper
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    isActive={item.id === currentStep}
                    isCompleted={item.id < currentStep}
                />
            ))}
        </div>
    );
}

export default Steps;
