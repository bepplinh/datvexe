import React from "react";
import { ChevronRight, Home } from "lucide-react";
import "./BreadcrumbNavigation.scss";

const BreadcrumbNavigation = ({ path = [], onNavigate, onHomeClick }) => {
    if (!path || path.length === 0) {
        return (
            <div className="breadcrumb-nav">
                <button
                    className="breadcrumb-nav__item breadcrumb-nav__item--home"
                    onClick={onHomeClick}
                >
                    <Home size={16} />
                    <span>Tất cả địa điểm</span>
                </button>
            </div>
        );
    }

    return (
        <div className="breadcrumb-nav">
            <button
                className="breadcrumb-nav__item breadcrumb-nav__item--home"
                onClick={onHomeClick}
            >
                <Home size={16} />
                <span>Tất cả</span>
            </button>
            {path.map((item, index) => {
                const isLast = index === path.length - 1;
                return (
                    <React.Fragment key={item.id}>
                        <ChevronRight
                            size={16}
                            className="breadcrumb-nav__separator"
                        />
                        <button
                            className={`breadcrumb-nav__item ${
                                isLast ? "breadcrumb-nav__item--active" : ""
                            }`}
                            onClick={() => !isLast && onNavigate?.(item)}
                            disabled={isLast}
                        >
                            <span className="breadcrumb-nav__icon">
                                {item.type === "city"
                                    ? "🏙️"
                                    : item.type === "district"
                                    ? "🏘️"
                                    : "📍"}
                            </span>
                            <span className="breadcrumb-nav__name">
                                {item.name}
                            </span>
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default BreadcrumbNavigation;
