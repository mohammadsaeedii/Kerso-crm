import type { SVGProps } from "react";
import { cn } from "@/lib/utils/cn";

const PATHS = {
  "dashboard": (
    <><path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l3.5-3.5"/><circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none"/></>
  ),
  "explore": (
    <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></>
  ),
  "analytics": (
    <><path d="M3 4h18"/><rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M12 15v4"/><path d="M9 19h6"/><path d="M8.5 11.5l2.5-2.5 2 2 2.5-3"/></>
  ),
  "customers": (
    <><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6"/><path d="M17.5 13.5a5.5 5.5 0 0 1 3.5 5.1"/></>
  ),
  "reviews": (
    <><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></>
  ),
  "sidebar": (
    <><rect x="3" y="4" width="18" height="16" rx="2.5"/><line x1="9" y1="4" x2="9" y2="20"/></>
  ),
  "search": (
    <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/></>
  ),
  "bell": (
    <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></>
  ),
  "message": (
    <><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-8l-3.5 3V16.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/></>
  ),
  "gear": (
    <><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>
  ),
  "chevron-down": (
    <><path d="M6 9l6 6 6-6"/></>
  ),
  "chevron-up": (
    <><path d="M6 15l6-6 6 6"/></>
  ),
  "chevron-left": (
    <><path d="M15 6l-6 6 6 6"/></>
  ),
  "chevron-right": (
    <><path d="M9 6l6 6-6 6"/></>
  ),
  "chevrons-left": (
    <><path d="M11 7l-5 5 5 5"/><path d="M18 7l-5 5 5 5"/></>
  ),
  "arrow-up": (
    <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></>
  ),
  "arrow-down": (
    <><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>
  ),
  "arrow-right": (
    <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>
  ),
  "trending-up": (
    <><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></>
  ),
  "trending-down": (
    <><path d="M3 7l6 6 4-4 8 8"/><path d="M17 17h4v-4"/></>
  ),
  "external-link": (
    <><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>
  ),
  "plus": (
    <><path d="M12 5v14"/><path d="M5 12h14"/></>
  ),
  "minus": (
    <><path d="M5 12h14"/></>
  ),
  "check": (
    <><path d="M5 12.5l4.5 4.5L19 7"/></>
  ),
  "check-circle": (
    <><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></>
  ),
  "x": (
    <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>
  ),
  "x-circle": (
    <><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/></>
  ),
  "filter": (
    <><path d="M3 5h18l-7 8v6l-4 2v-8z"/></>
  ),
  "sort": (
    <><path d="M8 4v16"/><path d="M5 8l3-4 3 4"/><path d="M16 20V4"/><path d="M13 16l3 4 3-4"/></>
  ),
  "more-h": (
    <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></>
  ),
  "more-v": (
    <><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></>
  ),
  "edit": (
    <><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></>
  ),
  "trash": (
    <><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></>
  ),
  "download": (
    <><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>
  ),
  "upload": (
    <><path d="M12 20V9"/><path d="M7 13l5-5 5 5"/><path d="M5 4h14"/></>
  ),
  "refresh": (
    <><path d="M20 11a8 8 0 0 0-14-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 4.5L20 16"/><path d="M20 20v-4h-4"/></>
  ),
  "copy": (
    <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></>
  ),
  "drag": (
    <><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/></>
  ),
  "dollar": (
    <><path d="M12 3v18"/><path d="M16 7.5C16 6 14.5 5 12 5S8 6 8 7.8s1.5 2.4 4 2.9 4 1.3 4 3.1S14.5 19 12 19s-4-1-4-2.7"/></>
  ),
  "calendar": (
    <><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3.5v3M16 3.5v3"/></>
  ),
  "mail": (
    <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/></>
  ),
  "phone": (
    <><path d="M5 4h3l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></>
  ),
  "map-pin": (
    <><path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></>
  ),
  "building": (
    <><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M5 21h14"/></>
  ),
  "briefcase": (
    <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></>
  ),
  "user": (
    <><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></>
  ),
  "users": (
    <><circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6"/><path d="M18 19a6 6 0 0 0-3-5.2"/></>
  ),
  "star": (
    <><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></>
  ),
  "flag": (
    <><path d="M5 21V4"/><path d="M5 4h11l-2 3.5 2 3.5H5"/></>
  ),
  "clock": (
    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>
  ),
  "sparkles": (
    <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/></>
  ),
  "heart": (
    <><path d="M12 20s-7-4.6-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.4 12 20 12 20z"/></>
  ),
  "thumbs-up": (
    <><path d="M7 10v10H4V10z"/><path d="M7 10l4-7a2 2 0 0 1 3 2l-1 5h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17 20H7"/></>
  ),
  "eye": (
    <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>
  ),
  "kanban": (
    <><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="14" rx="1.5"/></>
  ),
  "list": (
    <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none"/></>
  ),
  "grid": (
    <><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></>
  ),
  "sun": (
    <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></>
  ),
  "moon": (
    <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></>
  ),
  "logout": (
    <><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>
  ),
  "help": (
    <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.6-2 2-2 3.5"/><circle cx="12" cy="17.5" r=".9" fill="currentColor" stroke="none"/></>
  ),
  "info": (
    <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none"/></>
  ),
  "alert": (
    <><path d="M12 4l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17.3" r=".9" fill="currentColor" stroke="none"/></>
  ),
  "target": (
    <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></>
  ),
  "globe": (
    <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></>
  ),
  "pie": (
    <><path d="M12 3v9h9a9 9 0 1 0-9-9z" fill="none"/><path d="M21 12a9 9 0 1 1-9-9"/><path d="M12 3v9h9"/></>
  ),
  "tag": (
    <><path d="M4 11.5V5a1 1 0 0 1 1-1h6.5a1 1 0 0 1 .7.3l7 7a1 1 0 0 1 0 1.4l-6.5 6.5a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1-.3-.7z"/><circle cx="8.5" cy="8.5" r="1.4"/></>
  ),
  "link": (
    <><path d="M9 15l6-6"/><path d="M10.5 6.5l1-1a3.5 3.5 0 0 1 5 5l-2 2"/><path d="M13.5 17.5l-1 1a3.5 3.5 0 0 1-5-5l2-2"/></>
  ),
  "send": (
    <><path d="M21 4L3 11l6 2 2 6z"/><path d="M21 4l-10 9"/></>
  ),
  "command": (
    <><path d="M9 6a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v10a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2z"/></>
  ),
  "credit-card": (
    <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9.5h18"/><path d="M7 14.5h3"/></>
  ),
  "bell-off": (
    <><path d="M8.5 5.5A6 6 0 0 1 18 9c0 3 1 4.5 1.6 5.3"/><path d="M6 9c0 5-2 6-2 6h11"/><path d="M10 20a2 2 0 0 0 4 0"/><path d="M3 3l18 18"/></>
  ),
  "lock": (
    <><rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>
  ),
  "shield": (
    <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></>
  ),
  "palette": (
    <><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.4-1-1.5-1-2.5a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4c0-3.6-4-5.5-9-5.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/></>
  ),
  "inbox": (
    <><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><path d="M4 13h4.2a2 2 0 0 1 1.8 1.1L11 16h2l1-1.9a2 2 0 0 1 1.8-1.1H20"/></>
  ),
  "ticket": (
    <><path d="M4 9a2 2 0 0 0 0 4v4.5A1.5 1.5 0 0 0 5.5 19h13a1.5 1.5 0 0 0 1.5-1.5V13a2 2 0 0 0 0-4V6.5A1.5 1.5 0 0 0 18.5 5h-13A1.5 1.5 0 0 0 4 6.5z"/><path d="M12 8v8"/></>
  ),
  "bot": (
    <><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 3v3"/><circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><path d="M9 16.5h6"/></>
  ),
  "book": (
    <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 5.5v16"/><path d="M9 8h6M9 12h6"/></>
  ),
  "zap": (
    <><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></>
  ),
  "paperclip": (
    <><path d="M15.5 8.5l-6.2 6.2a2.5 2.5 0 0 0 3.5 3.5l7-7a4 4 0 0 0-5.7-5.7l-7.4 7.4a5.5 5.5 0 0 0 7.8 7.8L18 17"/></>
  ),
  "note": (
    <><path d="M6 4.5h9l4 4V19.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z"/><path d="M15 4.5V9h4.5"/><path d="M8 13h8M8 16h5"/></>
  ),
  "panel-right": (
    <><rect x="3" y="4" width="18" height="16" rx="2.5"/><line x1="15" y1="4" x2="15" y2="20"/></>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
} & Omit<
  SVGProps<SVGSVGElement>,
  "name" | "children" | "stroke" | "strokeWidth" | "width" | "height"
>;

export function Icon({
  name,
  size = 20,
  stroke = 1.7,
  className,
  ...rest
}: IconProps) {
  const inner = PATHS[name];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...rest}
    >
      {inner}
    </svg>
  );
}

export function hasIcon(name: string): name is IconName {
  return name in PATHS;
}

export const iconNames = Object.keys(PATHS) as IconName[];
