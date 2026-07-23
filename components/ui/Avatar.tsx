"use client";

import { useI18n } from "@/hooks/useI18n";
import type { AvatarColor } from "@/types";
import { cn } from "@/lib/utils/cn";

export type AvatarProps = {
  name: string;
  color?: AvatarColor | string;
  size?: number;
  online?: boolean;
  ring?: boolean;
  className?: string;
};

export function Avatar({
  name,
  color = "slate",
  size = 36,
  online,
  ring,
  className,
}: AvatarProps) {
  const { fmt } = useI18n();
  const fs = Math.round(size * 0.38);

  return (
    <span
      className={cn(
        "avatar",
        `avatar--${color}`,
        ring && "avatar--ring",
        className,
      )}
      style={{ width: size, height: size, fontSize: fs }}
      title={name}
    >
      {fmt.initials(name)}
      {online != null ? (
        <span
          className={cn("avatar__status", online ? "is-online" : "is-offline")}
        />
      ) : null}
    </span>
  );
}

export function FaceAvatar({ size = 40 }: { size?: number }) {
  return (
    <span className="avatar-face" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="20" fill="#FCE9DC" />
        <path
          d="M20 9c-5 0-8 3.4-8 8 0 1.2.2 2.3.6 3.2-1 .2-1.6.7-1.6 1.4 0 1 1.1 1.6 2.4 1.9C15 26.6 17.3 28 20 28s5-1.4 6.6-4.5c1.3-.3 2.4-.9 2.4-1.9 0-.7-.6-1.2-1.6-1.4.4-.9.6-2 .6-3.2 0-4.6-3-8-8-8z"
          fill="#F0B894"
        />
        <path
          d="M12 16c0-4.6 3-8 8-8s8 3.4 8 8c0-1-1-2.4-2.6-3-.6-1.6-2.6-2.6-5.4-2.6S15 11.4 14.4 13c-1.5.7-2.4 2-2.4 3z"
          fill="#5A3A2E"
        />
        <path
          d="M12.3 16.6C11 16.9 10 18 10 19.5c0 .9.4 1.7 1 2.3-.4-1.8-.4-3.6.3-5.2zM27.7 16.6c1.3.3 2.3 1.4 2.3 2.9 0 .9-.4 1.7-1 2.3.4-1.8.4-3.6-.3-5.2z"
          fill="#5A3A2E"
        />
        <circle cx="16.6" cy="18.4" r="1.05" fill="#3A2A22" />
        <circle cx="23.4" cy="18.4" r="1.05" fill="#3A2A22" />
        <path
          d="M17.4 22.2c1.4 1.1 3.8 1.1 5.2 0"
          fill="none"
          stroke="#9C5A3C"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M20 30c4.4 0 8 2.1 8 6v4H12v-4c0-3.9 3.6-6 8-6z"
          fill="#E2E8F0"
        />
        <path
          d="M17.4 28.6c.7 1.2 4.5 1.2 5.2 0l.6 2.2c-1.6 1.4-5.4 1.4-7 0z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}
