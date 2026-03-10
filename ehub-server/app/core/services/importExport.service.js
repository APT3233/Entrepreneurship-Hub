/**
 * Import/Export Service — xử lý import/export Excel/CSV
 *
 * TODO: Thêm dependencies `xlsx` và `csv-parse` khi implement chi tiết
 *       npm install xlsx csv-parse csv-stringify
 */
export const createImportExportService = ({ db }) => {
  /**
   * Export data to Excel format
   * @param {string} tableName - tên bảng hoặc view
   * @param {object} filters - điều kiện lọc
   * @param {string[]} columns - cột cần xuất
   * @returns {Buffer} Excel file buffer
   */
  const exportToExcel = async (tableName, filters = {}, columns = ["*"]) => {
    // TODO: implement with xlsx package
    throw new Error(
      "Export to Excel not yet implemented — install `xlsx` package",
    );
  };

  /**
   * Export data to CSV format
   * @param {string} tableName
   * @param {object} filters
   * @param {string[]} columns
   * @returns {string} CSV string
   */
  const exportToCsv = async (tableName, filters = {}, columns = ["*"]) => {
    // TODO: implement with csv-stringify package
    throw new Error(
      "Export to CSV not yet implemented — install `csv-stringify` package",
    );
  };

  /**
   * Import data from parsed rows
   * @param {string} tableName
   * @param {object[]} rows - parsed rows from Excel/CSV
   * @param {object} options - { validateRow, transformRow }
   * @returns {{ success: number, failed: number, errors: object[] }}
   */
  const importRows = async (tableName, rows, options = {}) => {
    // TODO: implement batch insert with validation
    throw new Error("Import not yet implemented");
  };

  return { exportToExcel, exportToCsv, importRows };
};
