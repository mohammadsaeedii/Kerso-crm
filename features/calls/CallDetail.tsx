"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/lib/icons";
import { CallPlayer } from "./CallPlayer";
import { formatDuration } from "@/lib/calls/duration";
import { summarizeCallTranscript } from "@/lib/calls/summarize";
import { localizedPath } from "@/lib/i18n/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import type { CallRecording, Customer } from "@/types";

export type CallDetailProps = {
  call: CallRecording | null;
  customer: Customer | undefined;
  onBack: () => void;
  onSummarize: (id: string, summary: string) => void;
};

const STATUS_VARIANT = {
  completed: "success",
  missed: "danger",
  voicemail: "warning",
} as const;

function hasAudio(call: CallRecording): boolean {
  return call.status !== "missed" && call.durationSec > 0;
}

export function CallDetail({
  call,
  customer,
  onBack,
  onSummarize,
}: CallDetailProps) {
  const { locale, fmt, dict } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!call) {
    return (
      <section className="calls__detail">
        <div className="inbox-empty inbox-empty--center">
          <EmptyState
            icon="phone-call"
            title={dict.callsPage.select}
            desc={dict.callsPage.selectDesc}
          />
        </div>
      </section>
    );
  }

  const runSummarize = () => {
    if (!call.transcript || busy) return;
    setBusy(true);
    window.setTimeout(() => {
      onSummarize(call.id, summarizeCallTranscript(call.transcript));
      setBusy(false);
      toast(dict.callsPage.summarized, { type: "success" });
    }, 700);
  };

  return (
    <section className="calls__detail">
      <header className="thread-head">
        <button
          type="button"
          className="icon-btn thread-head__back"
          onClick={onBack}
          aria-label={dict.callsPage.back}
        >
          <Icon name="chevron-left" size={20} />
        </button>
        {customer ? (
          <Avatar name={customer.name} color={customer.avatar} size={36} />
        ) : null}
        <div className="thread-head__main">
          <h2 className="thread-head__title">{call.subject}</h2>
          <p className="thread-head__sub">
            {customer?.name ?? "—"} · {fmt.relTime(call.startedAt)}
          </p>
        </div>
        <div className="thread-head__actions">
          {customer ? (
            <Link
              className="btn btn--secondary btn--sm"
              href={localizedPath(locale, `/customers?customer=${customer.id}`)}
            >
              {dict.callsPage.openCustomer}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="thread-body">
        <div className="call-meta">
          <Badge variant={STATUS_VARIANT[call.status]}>
            {dict.callsPage.status[call.status]}
          </Badge>
          <Badge variant="info">{dict.callsPage.direction[call.direction]}</Badge>
          {call.durationSec > 0 ? (
            <span className="call-meta__dur">
              {dict.callsPage.duration}: {fmt.digits(formatDuration(call.durationSec))}
            </span>
          ) : null}
        </div>

        <div className="call-card">
          <h3 className="call-card__title">{dict.callsPage.recording}</h3>
          {hasAudio(call) ? (
            <CallPlayer
              key={call.id}
              callId={call.id}
              durationSec={call.durationSec}
              recordingUrl={call.recordingUrl}
            />
          ) : (
            <EmptyState
              icon="phone-call"
              title={dict.callsPage.noRecording}
              desc={dict.callsPage.noRecordingDesc}
            />
          )}
        </div>

        <div className="call-card">
          <div className="call-card__head">
            <h3 className="call-card__title">{dict.callsPage.summary}</h3>
            <Button
              variant="primary"
              size="sm"
              icon="sparkles"
              disabled={!call.transcript || busy}
              onClick={runSummarize}
            >
              {busy ? dict.callsPage.summarizing : dict.callsPage.summarize}
            </Button>
          </div>
          {call.summary ? (
            <p className="call-card__body">{call.summary}</p>
          ) : (
            <p className="call-card__hint">{dict.callsPage.summarizeHint}</p>
          )}
        </div>

        <div className="call-card">
          <h3 className="call-card__title">{dict.callsPage.transcript}</h3>
          {call.transcript ? (
            <pre className="call-transcript">{call.transcript}</pre>
          ) : (
            <p className="call-card__hint">{dict.callsPage.noTranscript}</p>
          )}
        </div>
      </div>
    </section>
  );
}
