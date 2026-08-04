import { format } from "date-fns";

export const safeFormatDate = (
  dateVal: any,
  formatStr = "MMM d, yyyy",
): string => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "N/A";
  try {
    return format(d, formatStr);
  } catch (err) {
    return "N/A";
  }
};
