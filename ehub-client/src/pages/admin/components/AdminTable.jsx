import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminTable({
  columns,
  rows,
  rowKey = "id",
  loading,
  error,
  emptyText,
  meta,
  onPageChange,
  onRowClick,
}) {
  const { t } = useTranslation();
  const actualEmptyText = emptyText || t("common.noData");

  // Keep track of the local input value for limit
  const [limitInput, setLimitInput] = useState(String(meta?.limit || 10));

  // Sync state with meta.limit when it is updated
  useEffect(() => {
    if (meta?.limit) {
      setLimitInput(String(meta.limit));
    }
  }, [meta?.limit]);

  const handleLimitSubmit = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      onPageChange?.(1, num); // Reset to page 1 when limit changes
    } else {
      setLimitInput(String(meta?.limit || 10)); // Revert if invalid
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  // Handle column widths resizing
  const [colWidths, setColWidths] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      if (col.width) {
        initial[col.key] = col.width;
      }
    });
    return initial;
  });

  const handleMouseDown = (e, colKey) => {
    e.preventDefault();
    const startX = e.clientX;
    
    // Find the header element
    const thElement = e.target.closest("th");
    if (!thElement) return;
    const startWidth = thElement.getBoundingClientRect().width;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setColWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const isStickyRight = (column) => column.stickyRight || column.key === "actions";

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
        {t("common.loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => {
                const width = colWidths[column.key];
                const stickyRight = isStickyRight(column);
                return (
                  <th
                    key={column.key}
                    style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
                    className={`relative px-4 py-3 text-left text-xs font-bold text-gray-500 select-none group/th ${
                      stickyRight ? "sticky right-0 z-30 bg-gray-50 shadow-[-6px_0_12px_-8px_rgba(0,0,0,0.12)]" : ""
                    }`}
                  >
                    <div className="truncate pr-2">{column.label}</div>
                    <div
                      onMouseDown={(e) => handleMouseDown(e, column.key)}
                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none bg-transparent hover:bg-indigo-500/30 group-hover/th:bg-gray-200 active:bg-indigo-500 transition-colors"
                      style={{ zIndex: 10 }}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length ? rows.map((row) => (
              <tr 
                key={row[rowKey]} 
                onClick={() => onRowClick?.(row)} 
                className={`group/row hover:bg-gray-50/70 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((column) => {
                  const width = colWidths[column.key];
                  const stickyRight = isStickyRight(column);
                  return (
                    <td
                      key={column.key}
                      style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
                      className={`px-4 py-3 align-middle text-sm text-gray-700 truncate ${
                        stickyRight ? "sticky right-0 z-20 bg-white shadow-[-6px_0_12px_-8px_rgba(0,0,0,0.12)] group-hover/row:bg-gray-50" : ""
                      }`}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  );
                })}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-400">
                  {actualEmptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
          <span>
            {t("common.paginationInfo", { page: meta.page || 1, totalPages: meta.totalPages || 1, total: meta.total || 0 })}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Record limit manual input */}
            {meta.limit !== undefined ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">
                  {t("common.rowsPerPage") || "Rows/page:"}
                </span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  onBlur={(e) => handleLimitSubmit(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-14 rounded-lg border border-gray-200 px-2 py-0.5 text-center font-mono text-xs font-semibold text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : null}

            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!meta.hasPrev}
                onClick={() => onPageChange?.((meta.page || 1) - 1, meta.limit)}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                aria-label={t("common.previousPage")}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={!meta.hasNext}
                onClick={() => onPageChange?.((meta.page || 1) + 1, meta.limit)}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                aria-label={t("common.nextPage")}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
