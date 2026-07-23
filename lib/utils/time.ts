/** Fixed reference "now" matching the design's June 24 2024 context. */
export const APP_NOW = new Date("2024-06-24T15:32:00");

export function getAppNow(): Date {
  return new Date(APP_NOW.getTime());
}

export function daysAgo(d: number, now: Date = APP_NOW): Date {
  return new Date(now.getTime() - d * 86400000);
}

export function hoursAgo(h: number, now: Date = APP_NOW): Date {
  return new Date(now.getTime() - h * 3600000);
}

export function minsAgo(m: number, now: Date = APP_NOW): Date {
  return new Date(now.getTime() - m * 60000);
}
