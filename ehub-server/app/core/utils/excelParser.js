/**
 * Excel Parser — parse file .xlsx
 *
 * TODO: npm install xlsx
 *
 * Usage:
 *   const rows = await parseExcel(buffer, { sheet: 0, headerRow: 1 })
 */
export const parseExcel = async (buffer, options = {}) => {
  // TODO: implement with xlsx package
  // const XLSX = await import('xlsx')
  // const workbook = XLSX.read(buffer, { type: 'buffer' })
  // const sheetName = workbook.SheetNames[options.sheet || 0]
  // const sheet = workbook.Sheets[sheetName]
  // return XLSX.utils.sheet_to_json(sheet)
  throw new Error("Excel parser not yet implemented — install `xlsx` package");
};
