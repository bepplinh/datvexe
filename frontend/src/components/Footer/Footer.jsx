// Footer.jsx
import React from "react";
import "./footer.scss";
import ICON_FACEBOOK from "../../assets/footer/ICON_FACEBOOK.svg";
import ICON_YOUTUBE from "../../assets/footer/ICON_YOUTUBE.svg";
import ICON_TIKTOK from "../../assets/footer/ICON_TIKTOK.png";
import IMG_BOCONGTHUONG from "../../assets/footer/IMG_BOCONGTHUONG.png";
import IMG_IOS from "../../assets/footer/IMG_IOS.png";
import IMG_GOOGLE_PLAY from "../../assets/footer/IMG_GOOGLE_PLAY.png";
import ICON_QR from "../../assets/footer/ICON_QR.svg";
import ICON_PHONE from "../../assets/footer/ICON_PHONE.svg";
import ICON_HOME from "../../assets/footer/ICON_HOME.svg";
import ICON_GLOBE from "../../assets/footer/ICON_GLOBE.svg";
import ICON_MAIL from "../../assets/footer/ICON_MAIL.svg";
const IMG_PARTNER =
    "https://www.figma.com/api/mcp/asset/8e12fcc9-d9e4-4e26-b0db-44d3af6c5694";

function Footer() {
    return (
        <footer className="footer">
            <div className="footer__top">
                {/* Cột 1: Thông tin công ty + app */}
                <div className="footer__col footer__col--company">
                    <h4 className="footer__heading">
                        CÔNG TY TNHH XÂY DỰNG VẬN TẢI DUC ANH TRANSPORT
                    </h4>

                    <p className="footer__text">
                        ĐKKD số 2359567667 do Sở Kế Hoạch Và Đầu Tư tỉnh Thanh
                        Hóa, cấp ngày 09/05/2013
                    </p>

                    <div className="footer__info-item">
                        <img
                            src={ICON_HOME}
                            alt="Địa chỉ"
                            className="footer__icon"
                        />
                        <p className="footer__text">
                            55 Giải Phóng, Hai Bà Trưng, Hà Nội
                        </p>
                    </div>

                    <div className="footer__info-item">
                        <img
                            src={ICON_GLOBE}
                            alt="Website"
                            className="footer__icon"
                        />
                        <a
                            href="https://www.nhaxengocson.vn"
                            target="_blank"
                            rel="noreferrer"
                            className="footer__link"
                        >
                            www.nhaxengocson.vn
                        </a>
                    </div>

                    <div className="footer__info-item">
                        <img
                            src={ICON_MAIL}
                            alt="Email"
                            className="footer__icon"
                        />
                        <a
                            href="mailto:congtyngocson.abc@gmail.com"
                            className="footer__link"
                        >
                            ducanhtransport@gmail.com
                        </a>
                    </div>

                    <div className="footer__info-item">
                        <img
                            src={ICON_PHONE}
                            alt="Tổng đài"
                            className="footer__icon"
                        />
                        <a href="tel:02373833552" className="footer__link">
                            Tổng Đài Đặt vé: 0234 6666 888
                        </a>
                    </div>

                    <div className="footer__apps">
                        <div className="footer__apps-qr">
                            <img src={ICON_QR} alt="QR tải ứng dụng" />
                        </div>
                        <div className="footer__apps-store">
                            <h5 className="footer__subheading">Tải ứng dụng</h5>
                            <a
                                href="#google-play"
                                className="footer__store-btn"
                            >
                                <img src={IMG_GOOGLE_PLAY} alt="Google Play" />
                            </a>
                            <a href="#app-store" className="footer__store-btn">
                                <img src={IMG_IOS} alt="App Store" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Cột 2: Về chúng tôi + Đối tác */}
                <div className="footer__col">
                    <h4 className="footer__heading">Về chúng tôi</h4>
                    <ul className="footer__list">
                        <li>
                            <a href="#gioi-thieu" className="footer__link">
                                Giới thiệu Duc Anh Transport
                            </a>
                        </li>
                        <li>
                            <a href="#muc-tieu" className="footer__link">
                                Mục tiêu
                            </a>
                        </li>
                        <li>
                            <a href="#su-menh" className="footer__link">
                                Sứ mệnh, tầm nhìn, và Giá trị cốt lõi
                            </a>
                        </li>
                    </ul>

                    <div className="footer__partner">
                        <h4 className="footer__heading footer__heading--small">
                            Đối tác
                        </h4>
                        <div className="footer__partner-logo">
                            <img src={IMG_PARTNER} alt="Đối tác" />
                        </div>
                    </div>
                </div>

                {/* Cột 3: Hỗ trợ */}
                <div className="footer__col">
                    <h4 className="footer__heading">Hỗ trợ</h4>
                    <ul className="footer__list">
                        <li>
                            <a href="#quy-che" className="footer__link">
                                Quy chế hoạt động của APP/WEBSITE Duc Anh
                                Transport
                            </a>
                        </li>
                        <li>
                            <a href="#bao-mat" className="footer__link">
                                Chính sách bảo mật thông tin
                            </a>
                        </li>
                        <li>
                            <a href="#dieu-khoan" className="footer__link">
                                Điều khoản và quy định chung
                            </a>
                        </li>
                        <li>
                            <a href="#thanh-toan" className="footer__link">
                                Hình thức thanh toán
                            </a>
                        </li>
                        <li>
                            <a href="#van-chuyen" className="footer__link">
                                Chính sách vận chuyển
                            </a>
                        </li>
                        <li>
                            <a href="#hoan-huy" className="footer__link">
                                Chính sách hoàn huỷ vé
                            </a>
                        </li>
                        <li>
                            <a
                                href="#huong-dan-dat-ve"
                                className="footer__link"
                            >
                                Hướng dẫn đặt vé
                            </a>
                        </li>
                        <li>
                            <a href="#huong-dan-vnpay" className="footer__link">
                                Hướng dẫn thanh toán PayOS
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Cột 4: Tuyến xe + Liên kết + Bộ Công Thương */}
                <div className="footer__col">
                    <h4 className="footer__heading">Tuyến xe phổ biến</h4>
                    <ul className="footer__list footer__list--routes">
                        <li>Thọ Xuân - Bến xe Giáp Bát</li>
                        <li>Thọ Xuân - Bến xe Mỹ Đình</li>
                        <li>Bến xe Giáp Bát - Thọ Xuân</li>
                        <li>Bến xe Mỹ Đình - Thọ Xuân</li>
                    </ul>

                    <div className="footer__links-block">
                        <h4 className="footer__heading footer__heading--small">
                            Liên kết
                        </h4>
                        <div className="footer__socials">
                            <a href="#facebook" className="footer__social-link">
                                <img src={ICON_FACEBOOK} alt="Facebook" />
                            </a>
                            <a href="#youtube" className="footer__social-link">
                                <img src={ICON_YOUTUBE} alt="YouTube" />
                            </a>
                            <a href="#link" className="footer__social-link">
                                <img src={ICON_TIKTOK} alt="Link" />
                            </a>
                        </div>
                    </div>

                    <div className="footer__bocongthuong">
                        <img
                            src={IMG_BOCONGTHUONG}
                            alt="Đã thông báo Bộ Công Thương"
                        />
                    </div>
                </div>
            </div>

            <div className="footer__bottom">
                <p className="footer__bottom-text">
                    Copyright © 2025 Nhà Xe Đức Anh - All Rights Reserved.
                    Powered by{" "}
                    <span className="footer__bottom-brand">Duc Anh Le</span>
                </p>
            </div>
        </footer>
    );
}

export default Footer;
