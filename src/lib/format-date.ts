import { differenceInCalendarDays, format, isSameYear, isToday, isYesterday } from "date-fns"

/** Compact inbox-style timestamp: "3:42 PM", "Yesterday", "Mon", "Oct 3", "Oct 3, 2024". */
export function formatListDate(value: string | Date): string {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ""
  if (isToday(date)) return format(date, "h:mm a")
  if (isYesterday(date)) return "Yesterday"
  if (differenceInCalendarDays(new Date(), date) < 7) return format(date, "EEE")
  if (isSameYear(date, new Date())) return format(date, "MMM d")
  return format(date, "MMM d, yyyy")
}
