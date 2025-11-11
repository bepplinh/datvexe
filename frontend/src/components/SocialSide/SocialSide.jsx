import styles from "./styles.module.scss";
import data from "./data";

function SocialSide() {
    return (
        <div className={styles.social}>
            {data.map((item) => (
                <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialItem}
                >
                    <img src={item.img} alt={item.name} />
                </a>
            ))}
        </div>
    );
}

export default SocialSide;