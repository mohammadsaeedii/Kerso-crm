/**
 * @file Call transcript summarizer
 * @description Builds a short CRM summary from a speaker-labeled transcript.
 */

type Turn = { speaker: string; text: string };

const ACTION_RE =
  /\b(will|need|next|renew|price|send|schedule|follow|agree|demo|contract|invoice)\b/i;
const ACTION_RE_FA =
  /(تمدید|قیمت|ارسال|جلسه|نیاز|قرارداد|فاکتور|پیگیری|موافق|دمو|هفته)/;

/** Parses "Speaker: text" lines into turns. */
export function parseTranscriptTurns(transcript: string): Turn[] {
  return transcript
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx <= 0) return { speaker: "", text: line };
      return {
        speaker: line.slice(0, idx).trim(),
        text: line.slice(idx + 1).trim(),
      };
    })
    .filter((t) => t.text.length > 0);
}

function isActionLine(text: string): boolean {
  return ACTION_RE.test(text) || ACTION_RE_FA.test(text);
}

function overviewFromTurns(turns: Turn[]): string {
  const customer = turns.find((t) =>
    /customer|مشتری/i.test(t.speaker),
  );
  const first = customer?.text ?? turns[0]?.text ?? "";
  return first.length > 160 ? `${first.slice(0, 157)}…` : first;
}

function actionPoints(turns: Turn[]): string[] {
  const points = turns
    .filter((t) => isActionLine(t.text))
    .map((t) => t.text)
    .slice(0, 4);
  if (points.length) return points;
  return turns.slice(-2).map((t) => t.text);
}

/**
 * Summarizes a call transcript into overview, key points, and next steps.
 */
export function summarizeCallTranscript(transcript: string): string {
  const turns = parseTranscriptTurns(transcript);
  if (!turns.length) return "";
  const overview = overviewFromTurns(turns);
  const points = actionPoints(turns);
  const bullets = points.map((p) => `• ${p}`).join("\n");
  return `${overview}\n\n${bullets}`;
}
