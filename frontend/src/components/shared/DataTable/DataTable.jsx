import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, Download } from "lucide-react";
import "./DataTable.scss";

export default function DataTable({
    data = [],
    columns = [],
    title,
    searchable = false,
    sortable = true,
    exportable = false,
    onExport,
    className = "",
    emptyMessage = "Không có dữ liệu",
    pageSize = 10,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter((row) =>
            columns.some((col) => {
                const value = col.accessor ? col.accessor(row) : row[col.key];
                return String(value || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = columns.find((col) => col.key === sortConfig.key)?.accessor
                ? columns.find((col) => col.key === sortConfig.key).accessor(a)
                : a[sortConfig.key];
            const bValue = columns.find((col) => col.key === sortConfig.key)?.accessor
                ? columns.find((col) => col.key === sortConfig.key).accessor(b)
                : b[sortConfig.key];

            if (aValue === bValue) return 0;

            const comparison = aValue > bValue ? 1 : -1;
            return sortConfig.direction === "asc" ? comparison : -comparison;
        });
    }, [filteredData, sortConfig, columns]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const formatValue = (value, column) => {
        if (column.format) return column.format(value);
        if (typeof value === "number") return value.toLocaleString("vi-VN");
        return value || "-";
    };

    return (
        <div className={`data-table ${className}`}>
            {(title || searchable || exportable) && (
                <div className="data-table__header">
                    {title && <h3 className="data-table__title">{title}</h3>}
                    <div className="data-table__actions">
                        {searchable && (
                            <div className="data-table__search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="data-table__search-input"
                                />
                            </div>
                        )}
                        {exportable && onExport && (
                            <button
                                onClick={() => onExport(sortedData)}
                                className="data-table__export-btn"
                            >
                                <Download size={16} />
                                Xuất file
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="data-table__container">
                <table className="data-table__table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`data-table__th ${sortable && column.sortable !== false
                                            ? "data-table__th--sortable"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        sortable && column.sortable !== false
                                            ? handleSort(column.key)
                                            : null
                                    }
                                    style={{ width: column.width }}
                                >
                                    <div className="data-table__th-content">
                                        {column.header}
                                        {sortable &&
                                            column.sortable !== false &&
                                            sortConfig.key === column.key && (
                                                <span className="data-table__sort-icon">
                                                    {sortConfig.direction === "asc" ? (
                                                        <ChevronUp size={14} />
                                                    ) : (
                                                        <ChevronDown size={14} />
                                                    )}
                                                </span>
                                            )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="data-table__empty"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, index) => (
                                <tr key={row.id || index} className="data-table__tr">
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`data-table__td ${column.className || ""
                                                }`}
                                        >
                                            {column.render
                                                ? column.render(
                                                    column.accessor
                                                        ? column.accessor(row)
                                                        : row[column.key],
                                                    row
                                                )
                                                : formatValue(
                                                    column.accessor
                                                        ? column.accessor(row)
                                                        : row[column.key],
                                                    column
                                                )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="data-table__pagination">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="data-table__pagination-btn"
                    >
                        Trước
                    </button>
                    <span className="data-table__pagination-info">
                        Trang {currentPage} / {totalPages} ({sortedData.length} kết quả)
                    </span>
                    <button
                        onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="data-table__pagination-btn"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}

