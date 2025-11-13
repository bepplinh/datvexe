import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import "./TopBanner.scss";

const data = [
    {
        id: 1,
        icon: PhoneInTalkIcon,
        text: "CSKH: 02373 939 939",
    },
    {
        id: 2,
        icon: PhoneInTalkIcon,
        text: "Hotline đặt vé Sầm Sơn: 02373.83.83.83",
    },
    {
        id: 3,
        icon: PhoneInTalkIcon,
        text: "Hotline đặt vé 24/7: 02378 888 888",
    },
    { id: 4, icon: LocalShippingIcon, text: "Hàng hóa: 1900 8888" },
];

function TopBanner() {
    return (
        <div className="section-top">
            <div className="container">
                {data.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.id} className="top-banner-item">
                            <Icon className="top-banner-icon" />
                            <p>{item.text}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TopBanner;
