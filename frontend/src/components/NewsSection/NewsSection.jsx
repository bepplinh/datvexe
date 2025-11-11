import React, { useState, useMemo } from "react";
import "./NewsSection.scss";
import dulich from "../../assets/dulich.jpg";
import newsIcon from "../../assets/news.svg";
// nếu bạn có ảnh khác, import tương tự:
// import news2 from "../../assets/news2.jpg";
// import news3 from "../../assets/news3.jpg";
// ... hoặc dùng đường dẫn public (/assets/...)

const newsData = [
    {
        img: dulich,
        title: "Top 6 địa điểm du lịch Thanh Hóa ăn chơi cực thích",
        excerpt:
            "Với địa hình trải dài từ Đông sang Tây, du lịch Thanh Hóa được thiên nhiên ban tặng nhiều loại hình hấp dẫn...",
    },
    {
        img: "/assets/news2.jpg",
        title: "Lễ công bố và trao quyết định thành lập công đoàn cơ sở",
        excerpt:
            "Chiều ngày 27/12/2024, Liên đoàn Lao động huyện Thọ Xuân tổ chức Lễ công bố và trao Quyết định thành lập...",
    },
    {
        img: "/assets/news3.jpg",
        title: "Thông báo hợp nhất 4 nhà xe thành nhà xe Ngọc Sơn",
        excerpt:
            "Nhà xe Ngọc Sơn xin trân trọng thông báo tới Quý khách hàng về việc hợp nhất 4 nhà xe...",
    },
    {
        img: "/assets/news4.jpg",
        title: "Chương trình ưu đãi mùa hè",
        excerpt:
            "Ưu đãi đặc biệt cho khách đặt vé trong tháng 6 - giảm đến 20% cho tuyến...",
    },
    {
        img: "/assets/news5.jpg",
        title: "An toàn giao thông mùa lễ",
        excerpt:
            "Những lưu ý cho hành khách khi đi lại trong dịp lễ nhằm đảm bảo an toàn...",
    },
    {
        img: "/assets/news6.jpg",
        title: "Tuyển dụng tài xế và nhân viên phục vụ",
        excerpt:
            "Nhà xe Ngọc Sơn tuyển dụng tài xế giường nằm, yêu cầu bằng lái D và kinh nghiệm...",
    },
];

export default function NewsSection() {
    // số card hiển thị cùng lúc trên desktop (3), tablet (2), mobile (1)
    // logic hiển thị dựa vào CSS media queries; ở JS ta điều khiển perGroup = 3
    const perGroup = 3;
    const groups = useMemo(() => {
        const g = [];
        for (let i = 0; i < newsData.length; i += perGroup) {
            g.push(newsData.slice(i, i + perGroup));
        }
        return g;
    }, []);

    const [groupIndex, setGroupIndex] = useState(0);
    const totalGroups = groups.length;

    const prev = () =>
        setGroupIndex((s) => (s - 1 + totalGroups) % totalGroups);
    const next = () => setGroupIndex((s) => (s + 1) % totalGroups);

    return (
        <section className="news-section" aria-label="Tin tức cập nhật">
            <div className="container">
                <div className="section-header">
                    <div className="left">
                        <img
                            src={newsIcon}
                            alt="Tin tức"
                            className="news-icon"
                        />
                        <h2>Tin tức cập nhật</h2>
                    </div>
                    <div className="right">
                        <a href="#" className="view-more">
                            Xem thêm
                        </a>
                    </div>
                </div>

                <div className="news-slider-wrapper">
                    {/* track: width = groups.length * 100% ; translateX moves by -groupIndex * 100% */}
                    <div
                        className="news-slider-track"
                        style={{
                            width: `${groups.length * 100}%`,
                            transform: `translateX(-${groupIndex * 100}%)`,
                        }}
                    >
                        {groups.map((group, gi) => (
                            <div
                                className="news-group"
                                key={gi}
                                aria-hidden={gi !== groupIndex}
                            >
                                {group.map((item, idx) => (
                                    <article className="news-card" key={idx}>
                                        <div className="thumb">
                                            <img
                                                src={item.img}
                                                alt={item.title}
                                            />
                                        </div>
                                        <div className="card-body">
                                            <h3>{item.title}</h3>
                                            <p>{item.excerpt}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* controls (hidden on small screens via CSS) */}
                    <button
                        className="ctrl prev"
                        onClick={prev}
                        aria-label="Bài trước"
                    >
                        ‹
                    </button>
                    <button
                        className="ctrl next"
                        onClick={next}
                        aria-label="Bài tiếp"
                    >
                        ›
                    </button>
                </div>
            </div>
        </section>
    );
}
