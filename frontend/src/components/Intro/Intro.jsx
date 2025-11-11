import data from "./data";
import MainLayout from "../../layout/MainLayout/MainLayout";
import styles from "./styles.module.scss";

function Intro() {
    const { introContainer, intro } = styles;
    return (
        <MainLayout>
            <div className={introContainer}>
                {data.map((item) => (
                    <div key={item.id} className={intro}>
                        <img src={item.img} alt={item.label} />
                        <p>{item.label}</p>
                    </div>
                ))}
            </div>
        </MainLayout>
    );
}

export default Intro;
