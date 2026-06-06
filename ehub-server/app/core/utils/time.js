/**
 * Get current date string in YYYY-MM-DD format based on local timezone
 * @returns {string} Formatted date string
 */
export const getLocalDateString = () => {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const partMap = {};
  formatter.formatToParts(date).forEach((p) => (partMap[p.type] = p.value));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

/**
 * Get current ISO timestamp strictly in Asia/Ho_Chi_Minh timezone (+07:00)
 * @returns {string} Formatted timestamp string (e.g. 2026-05-31T10:35:43.123+07:00)
 */
export const getLocalTimestamp = () => {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  });
  const partMap = {};
  formatter.formatToParts(date).forEach((p) => (partMap[p.type] = p.value));
  let hour = partMap.hour;
  if (hour === "24") hour = "00";
  return `${partMap.year}-${partMap.month}-${partMap.day}T${hour}:${partMap.minute}:${partMap.second}.${partMap.fractionalSecond}+07:00`;
};
