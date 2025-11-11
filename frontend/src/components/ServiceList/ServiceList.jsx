import React from "react";
import "./ServiceList.scss";

/**
 * Lưu ý:
 * - Mình dùng trực tiếp các asset URL export từ Figma.
 * - Bạn có thể tải về và để trong /public/assets/ rồi đổi đường dẫn tương ứng.
 */

const IMG_VECTOR =
    "https://www.figma.com/api/mcp/asset/74a7ba24-1608-4d76-9886-ec5057ee3196";
const IMG_OVERLAY_SHADOW =
    "https://www.figma.com/api/mcp/asset/4dd69998-8ae5-4dda-b186-df216ce58079";
const IMG_OVERLAY_SHADOW_1 =
    "https://www.figma.com/api/mcp/asset/9eb3017c-91c3-4c76-90d2-3727cff3a5db";
const IMG_OVERLAY_SHADOW_2 =
    "https://www.figma.com/api/mcp/asset/d8fabe5e-77c0-4114-81ad-6b44710fa289";
const IMG_SERVICE_SVG =
    "https://www.figma.com/api/mcp/asset/ce081f31-dded-4d54-82d1-83a5bb21f55d";
const IMG_GROUP =
    "https://www.figma.com/api/mcp/asset/e012037c-cf84-4850-a15d-ecf6f4af37dd";
const IMG_GROUP1 =
    "https://www.figma.com/api/mcp/asset/3a25c54b-5be6-450c-ba34-ee13aad99de1";
const IMG_OUTSTANDING =
    "https://www.figma.com/api/mcp/asset/0ec06f41-28f0-4de4-b6cb-6d7190b92d0d";

const services = [
    {
        title: "Xe phòng VIP",
        lines: [
            "Xe 22 phòng VIP Ngọc Sơn với phiên bản",
            "22 giường thuộc xe bus giường nằm cao",
            "cấp thế hệ mới.",
        ],
        overlay: IMG_OVERLAY_SHADOW,
    },
    {
        title: "Vận chuyển hàng hoá",
        lines: [
            "Ngọc Sơn cung cấp dịch vụ vận chuyển",
            "hàng hoá nhanh với giá cước hợp lý tuyến",
            "Thọ Xuân đi Hà Nội và ngược lại.",
        ],
        overlay: IMG_OVERLAY_SHADOW_1,
    },
    {
        title: "Xe trung chuyển",
        lines: [
            "Nhà xe Ngọc Sơn có hệ thống Xe trung",
            "chuyển đón/trả tận nơi, miễn phí tại Thọ",
            "Xuân với giá vé không đổi",
        ],
        overlay: IMG_OVERLAY_SHADOW_2,
    },
];

export default function ServiceList() {
    return (
        <section className="service-list-outer" aria-label="Dịch vụ nổi bật">
            {/* decorative vector (giữ đúng vị trí từ design) */}
            <div className="service-vector">
                <img src={IMG_VECTOR} alt="" />
            </div>

            <div className="service-inner container">
                <div className="service-header">
                    <div className="service-icon">
                        <img src={IMG_OUTSTANDING} alt="" />
                    </div>
                    <h2 className="service-heading">Dịch vụ nổi bật</h2>
                </div>

                <div className="service-grid">
                    {services.map((s, idx) => (
                        <article className="service-item" key={idx}>
                            {/* overlay shadow (absolute, hovers behind card) */}
                            <div className="overlay-shadow" aria-hidden>
                                <img src={s.overlay} alt="" />
                            </div>

                            <div className="service-card">
                                <div className="service-card-content">
                                    <h3 className="service-title">{s.title}</h3>
                                    <div className="service-desc">
                                        {s.lines.map((l, i) => (
                                            <p key={i}>{l}</p>
                                        ))}
                                    </div>
                                </div>

                                {/* icon floating (absolute within card) */}
                                <div className="service-icon-float">
                                    <img src={IMG_SERVICE_SVG} alt="" />
                                    {/* optional masked group - kept as img for fidelity */}
                                    <img
                                        className="mask-group"
                                        src={IMG_GROUP1}
                                        alt=""
                                    />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
