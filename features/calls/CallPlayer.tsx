"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { formatDuration } from "@/lib/calls/duration";
import { createRecordingDataUri } from "@/lib/calls/recording-audio";
import { useI18n } from "@/hooks/useI18n";

export type CallPlayerProps = {
  callId: string;
  durationSec: number;
  recordingUrl: string;
  disabled?: boolean;
};

const BAR_COUNT = 36;

function barHeights(seed: string): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const n = seed.charCodeAt(i % seed.length) + i * 7;
    return 28 + (n % 72);
  });
}

function srcForCall(callId: string, recordingUrl: string, durationSec: number): string {
  if (!recordingUrl.startsWith("seed://")) return recordingUrl;
  return createRecordingDataUri(callId, Math.min(durationSec, 8));
}

export function CallPlayer({
  callId,
  durationSec,
  recordingUrl,
  disabled = false,
}: CallPlayerProps) {
  const { fmt, dict } = useI18n();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const src = useMemo(
    () => srcForCall(callId, recordingUrl, durationSec),
    [callId, recordingUrl, durationSec],
  );
  const heights = barHeights(callId);
  const clipSec = Math.min(durationSec, 8);
  const current = progress * clipSec;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      const d = el.duration && Number.isFinite(el.duration) ? el.duration : 1;
      setProgress(el.currentTime / d);
    };
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el || disabled) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    void el.play().then(() => setPlaying(true));
  };

  return (
    <div className="call-player">
      <audio ref={audioRef} src={src || undefined} preload="metadata" />
      <IconButton
        icon={playing ? "pause" : "play"}
        tip={playing ? dict.callsPage.pause : dict.callsPage.play}
        onClick={toggle}
        disabled={disabled}
        className="call-player__play"
      />
      <div className="call-player__wave" aria-hidden="true">
        {heights.map((h, i) => (
          <span
            key={i}
            className={i / BAR_COUNT <= progress ? "is-played" : undefined}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <span className="call-player__time">
        {fmt.digits(formatDuration(current))}
        <span aria-hidden="true"> / </span>
        {fmt.digits(formatDuration(clipSec))}
      </span>
    </div>
  );
}
