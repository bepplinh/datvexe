import "./ServiceCard.scss";

function ServiceCard({ image, url, label, text }) {
    return (
        <div className="service-card">
            <div className="service-card__image-wrapper">
                <img 
                    src={image} 
                    alt={label}
                    className="service-card__image"
                />
            </div>
            <div className="service-card__content">
                <div className="service-card__icon">
                    <img src={url} alt={label} />
                </div>
                <div className="service-card__info">
                    <h3 className="service-card__title">{label}</h3>
                    <p className="service-card__text">{text}</p>
                </div>
            </div>
        </div>
    );
}

export default ServiceCard;
