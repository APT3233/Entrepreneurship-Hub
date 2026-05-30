import { createElement } from "react";
import DateTimeCell from "@/components/ui/DateTimeCell";

/** Renders a two-row date/time cell (for tables, detail grids, inline JSX). */
export function formatDate(value) {
  return createElement(DateTimeCell, { value: value || undefined });
}

/** Renders date only (single row: dd - MM - yyyy). */
export function formatDateOnly(value) {
  return createElement(DateTimeCell, { value: value || undefined, dateOnly: true });
}
