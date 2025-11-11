import banner from "../../assets/banner.png";
import styles from "./styles.module.scss";

function Banner() {
    const { bannerContainer } = styles;

    return (
        <div className={bannerContainer}>
            <img src={banner} alt="" />
        </div>
    );
}

export default Banner;
