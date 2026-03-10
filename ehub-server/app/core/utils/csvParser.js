/**
 * CSV Parser — parse file .csv
 *
 * TODO: npm install csv-parse
 *
 * Usage:
 *   const rows = await parseCsv(csvString, { delimiter: ',' })
 */
export const parseCsv = async (csvString, options = {}) => {
  // TODO: implement with csv-parse package
  // const { parse } = await import('csv-parse/sync')
  // return parse(csvString, {
  //   columns: true,
  //   skip_empty_lines: true,
  //   delimiter: options.delimiter || ',',
  // })
  throw new Error(
    "CSV parser not yet implemented — install `csv-parse` package",
  );
};
