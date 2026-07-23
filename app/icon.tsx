import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="7" r="2.4" fill="#4F46E5" />
          <circle cx="9" cy="11" r="2.1" fill="#6366F1" />
          <circle cx="23" cy="11" r="2.1" fill="#6366F1" />
          <circle cx="16" cy="15" r="2.6" fill="#4338CA" />
          <circle cx="8" cy="19" r="1.8" fill="#818CF8" />
          <circle cx="24" cy="19" r="1.8" fill="#818CF8" />
          <circle cx="16" cy="23" r="2.1" fill="#6366F1" />
          <circle cx="11" cy="25" r="1.5" fill="#A5B4FC" />
          <circle cx="21" cy="25" r="1.5" fill="#A5B4FC" />
        </svg>
      </div>
    ),
    size,
  );
}
