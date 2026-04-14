/** Partially hide local-part for safe UI preview (activation flow). */
export const maskEmail = (addr) => {
  if (!addr || typeof addr !== "string" || !addr.includes("@")) return "***";
  const [local, domain] = addr.split("@");
  const show = local.length <= 2 ? "*" : `${local.slice(0, 2)}***`;
  return `${show}@${domain}`;
};
