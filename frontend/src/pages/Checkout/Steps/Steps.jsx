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
            {dataSteps.map((item, index) => {
                const isActive = item.id === currentStep;
                const isCompleted = item.id < currentStep;
                const prevStepCompleted = index > 0 && dataSteps[index - 1].id < currentStep;

                return (
                    <Stepper
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        isActive={isActive}
                        isCompleted={isCompleted}
                        prevStepCompleted={prevStepCompleted}
                    />
                );
            })}
        </div>
    );
}

export default Steps;
