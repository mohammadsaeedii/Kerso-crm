/**
 * @file Synthetic call recording audio
 * @description Builds a short phone-quality WAV blob for demo playback.
 */

const SAMPLE_RATE = 8000;

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function sampleAt(t: number, seed: number): number {
  const voice = seed % 2 === 0 ? 220 : 330;
  const other = voice === 220 ? 330 : 220;
  const cycle = t % 2.4;
  const talking = cycle < 1.1 || (cycle > 1.3 && cycle < 2.1);
  const freq = cycle < 1.2 ? voice : other;
  if (!talking) return Math.sin(2 * Math.PI * 50 * t) * 0.02;
  const env = Math.sin((Math.PI * (cycle % 1.1)) / 1.1);
  const tone = Math.sin(2 * Math.PI * freq * t);
  const buzz = Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25;
  return (tone + buzz) * env * 0.28;
}

function writeWavHeader(view: DataView, count: number): void {
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, count * 2, true);
}

function fillPcm(view: DataView, count: number, seed: number): void {
  for (let i = 0; i < count; i++) {
    const s = Math.max(-1, Math.min(1, sampleAt(i / SAMPLE_RATE, seed)));
    view.setInt16(44 + i * 2, s * 0x7fff, true);
  }
}

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function buildWavBuffer(id: string, durationSec: number): ArrayBuffer {
  const seconds = Math.min(Math.max(durationSec, 4), 8);
  const count = SAMPLE_RATE * seconds;
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, count);
  fillPcm(view, count, hashSeed(id));
  return buffer;
}

/** Data URI of a short phone-quality WAV for demo playback. */
export function createRecordingDataUri(id: string, durationSec: number): string {
  const buffer = buildWavBuffer(id, durationSec);
  return `data:audio/wav;base64,${bytesToBase64(buffer)}`;
}
