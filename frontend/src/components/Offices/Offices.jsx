import React from "react";
import "./Offices.scss";
import branches from "../../assets/branches.svg";
import home_circle from "../../assets/home-circle.svg";
import phone_circle from "../../assets/phone-circle.svg";

const offices = [
    {
        img: home_circle,
        name: "Văn phòng bến Mỹ Đình",
        address: "76 Trần Vỹ - Mai Dịch - Cầu Giấy - Hà Nội",
        phone: "02373833552",
    },
    {
        img: home_circle,
        name: "Văn phòng bến Giáp Bát",
        address: "Quầy T1; Phòng vé số 16; Chỗ đỗ xe A3-12",
        phone: "02373833552",
    },
    {
        img: home_circle,
        name: "Văn phòng bến Thọ Xuân",
        address: "Nhà xe Ngọc Sơn, khu 5, thị trấn Thọ Xuân, Thanh Hoá",
        phone: "02373833552",
    },
];

export default function Offices() {
    return (
        <div className="office">
            <div className="container">
                <div className="header">
                    <img src={branches} alt="branches" />
                    <h2>Hệ thống phòng vé</h2>
                </div>

                <div className="content">
                    {offices.map((item, index) => {
                        return (
                            <div className="content-section" key={index}>
                                <div className="content-top">
                                    <div>
                                        <img src={item.img} alt={item.name} />
                                    </div>
                                    <div>
                                        <h2>{item.name}</h2>
                                        <p>{item.address}</p>
                                    </div>
                                </div>
                                <div className="content-bottom">
                                    <img src={phone_circle} alt="phone" />
                                    <p>{item.phone}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
