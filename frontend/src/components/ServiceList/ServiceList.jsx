import ServiceCard from "./ServiceCard";
import "./ServiceList.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
import service from "../../assets/service.svg";
import service_img_1 from "../../assets/service_img_1.jpeg";
import huychuong from "../../assets/huychuong.svg";

const data = [
    {
        image: service_img_1,
        url: service,
        label: "Xe phòng VIP",
        text: "Xe 22 phòng VIP Ngọc Sơn với phiên bản 22 giường thuộc xe bus giường nằm cao cấp thế hệ mới.",
    },
    {
        image: service_img_1,
        url: service,
        label: "Vận chuyển hàng hoá",
        text: "Ngọc Sơn cung cấp dịch vụ vận chuyển hàng hoá nhanh với giá cước hợp lý tuyến Thọ Xuân đi Hà Nội và ngược lại.",
    },
    {
        image: service_img_1,
        url: service,
        label: "Xe trung chuyển",
        text: "Nhà xe Ngọc Sơn có hệ thống Xe trung chuyển đón/trả tận nơi, miễn phí tại Thọ Xuân với giá vé không đổi",
    },
];

function ServiceList() {
    return (
        <div className="service-list">
            <MainLayout>
                <div className="service-header">
                    <img src={huychuong} alt="" />
                    <p>Dịch vụ nổi bật</p>
                </div>
                <div className="service-list__container">
                    {data.map((item, index) => {
                        return (
                            <ServiceCard
                                key={index}
                                image={item.image}
                                url={item.url}
                                label={item.label}
                                text={item.text}
                            />
                        );
                    })}
                </div>
            </MainLayout>
        </div>
    );
}

export default ServiceList;
