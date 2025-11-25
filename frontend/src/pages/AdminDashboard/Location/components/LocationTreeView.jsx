import React, { useState, useEffect, useMemo } from "react";
import {
    ChevronRight,
    ChevronDown,
    MapPin,
    Plus,
    Edit,
    Trash2,
    Eye,
} from "lucide-react";
import "./LocationTreeView.scss";

const LocationTreeView = ({
    locations = [],
    onView,
    onEdit,
    onDelete,
    onAddChild,
    selectedLocationId = null,
    onLocationSelect,
}) => {
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [highlightedId, setHighlightedId] = useState(null);

    // Xây dựng cây phân cấp từ danh sách locations
    const tree = useMemo(() => {
        const locationMap = new Map();
        const rootNodes = [];

        // Tạo map tất cả locations
        locations.forEach((loc) => {
            locationMap.set(loc.id, {
                ...loc,
                children: [],
                level: 0,
            });
        });

        // Xây dựng cây
        locations.forEach((loc) => {
            const node = locationMap.get(loc.id);
            if (loc.parent_id && locationMap.has(loc.parent_id)) {
                const parent = locationMap.get(loc.parent_id);
                parent.children.push(node);
                node.level = parent.level + 1;
            } else {
                rootNodes.push(node);
            }
        });

        // Sắp xếp children theo tên
        const sortChildren = (node) => {
            node.children.sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            );
            node.children.forEach(sortChildren);
        };

        rootNodes.forEach(sortChildren);
        return rootNodes;
    }, [locations]);

    // Tự động expand node được chọn
    useEffect(() => {
        if (selectedLocationId) {
            const expandPath = (node, targetId, path = []) => {
                if (node.id === targetId) {
                    return [...path, node.id];
                }
                for (const child of node.children) {
                    const result = expandPath(child, targetId, [
                        ...path,
                        node.id,
                    ]);
                    if (result) return result;
                }
                return null;
            };

            for (const root of tree) {
                const path = expandPath(root, selectedLocationId);
                if (path) {
                    setExpandedNodes(new Set(path));
                    break;
                }
            }
        }
    }, [selectedLocationId, tree]);

    const toggleExpand = (nodeId) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "city":
                return "🏙️";
            case "district":
                return "🏘️";
            case "ward":
                return "📍";
            default:
                return "📍";
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case "city":
                return "Thành phố";
            case "district":
                return "Quận/Huyện";
            case "ward":
                return "Phường/Xã";
            default:
                return type;
        }
    };

    const getTypeClass = (type) => {
        switch (type) {
            case "city":
                return "location-tree-node--city";
            case "district":
                return "location-tree-node--district";
            case "ward":
                return "location-tree-node--ward";
            default:
                return "";
        }
    };

    const renderNode = (node, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedLocationId === node.id;
        const isHighlighted = highlightedId === node.id;

        return (
            <div
                key={node.id}
                className={`location-tree-node ${getTypeClass(node.type)} ${
                    isSelected ? "location-tree-node--selected" : ""
                } ${isHighlighted ? "location-tree-node--highlighted" : ""}`}
                style={{ "--depth": depth }}
            >
                <div
                    className="location-tree-node__content"
                    onClick={() => {
                        onLocationSelect?.(node);
                        if (hasChildren) {
                            toggleExpand(node.id);
                        }
                    }}
                    onMouseEnter={() => setHighlightedId(node.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                >
                    <div className="location-tree-node__left">
                        {hasChildren ? (
                            <button
                                className="location-tree-node__expand"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(node.id);
                                }}
                            >
                                {isExpanded ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </button>
                        ) : (
                            <span className="location-tree-node__spacer" />
                        )}

                        <span className="location-tree-node__icon">
                            {getTypeIcon(node.type)}
                        </span>

                        <div className="location-tree-node__info">
                            <span className="location-tree-node__name">
                                {node.name || "Chưa có tên"}
                            </span>
                            <span className="location-tree-node__type">
                                {getTypeLabel(node.type)}
                            </span>
                        </div>
                    </div>

                    <div className="location-tree-node__actions">
                        <button
                            className="location-tree-node__action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView?.(node);
                            }}
                            title="Xem chi tiết"
                        >
                            <Eye size={14} />
                        </button>
                        <button
                            className="location-tree-node__action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(node);
                            }}
                            title="Chỉnh sửa"
                        >
                            <Edit size={14} />
                        </button>
                        {node.type !== "ward" && (
                            <button
                                className="location-tree-node__action-btn location-tree-node__action-btn--add"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddChild?.(node);
                                }}
                                title={`Thêm ${
                                    node.type === "city"
                                        ? "quận/huyện"
                                        : "phường/xã"
                                }`}
                            >
                                <Plus size={14} />
                            </button>
                        )}
                        <button
                            className="location-tree-node__action-btn location-tree-node__action-btn--delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(node);
                            }}
                            title="Xóa"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="location-tree-node__children">
                        {node.children.map((child) =>
                            renderNode(child, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (tree.length === 0) {
        return (
            <div className="location-tree-view__empty">
                <MapPin size={48} />
                <p>Chưa có địa điểm nào</p>
            </div>
        );
    }

    return (
        <div className="location-tree-view">
            <div className="location-tree-view__header">
                <div className="location-tree-view__legend">
                    <span className="location-tree-view__legend-item">
                        <span>🏙️</span> Thành phố
                    </span>
                    <span className="location-tree-view__legend-item">
                        <span>🏘️</span> Quận/Huyện
                    </span>
                    <span className="location-tree-view__legend-item">
                        <span>📍</span> Phường/Xã
                    </span>
                </div>
                <div className="location-tree-view__stats">
                    Tổng: {locations.length} địa điểm
                </div>
            </div>
            <div className="location-tree-view__content">
                {tree.map((root) => renderNode(root))}
            </div>
        </div>
    );
};

export default LocationTreeView;
