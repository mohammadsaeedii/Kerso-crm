"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHead } from "@/components/ui/PageHead";
import { CallDetail } from "./CallDetail";
import { CallList, type CallFilter } from "./CallList";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useRecordQuery } from "@/hooks/useRecordQuery";
import { callsForCustomer } from "@/lib/data/relations";
import { cn } from "@/lib/utils/cn";
import type { CallRecording } from "@/types";

function matchesFilter(call: CallRecording, filter: CallFilter): boolean {
  if (filter === "all") return true;
  if (filter === "missed") return call.status === "missed";
  return call.direction === filter;
}

function matchesQuery(
  call: CallRecording,
  customerName: string,
  query: string,
): boolean {
  if (!query) return true;
  return (
    call.subject.toLowerCase().includes(query) ||
    customerName.toLowerCase().includes(query) ||
    call.transcript.toLowerCase().includes(query)
  );
}

export function CallsPage({
  initialCallId = null,
  initialCustomerId = null,
}: {
  initialCallId?: string | null;
  initialCustomerId?: string | null;
}) {
  const { dict } = useI18n();
  const { data, updateCall } = useData();
  const [callId, setCallId] = useRecordQuery("call", initialCallId);
  const [customerParam] = useRecordQuery("customer", initialCustomerId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CallFilter>("all");
  const [pane, setPane] = useState<"list" | "detail">("list");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = customerParam
      ? callsForCustomer(data.calls, customerParam)
      : [...data.calls].sort(
          (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
        );
    return pool
      .filter((c) => matchesFilter(c, filter))
      .filter((c) => {
        const cust = data.customers.find((x) => x.id === c.customerId);
        return matchesQuery(c, cust?.name ?? "", q);
      });
  }, [data.calls, data.customers, filter, query, customerParam]);

  useEffect(() => {
    if (callId && rows.some((c) => c.id === callId)) return;
    if (rows[0]) setCallId(rows[0].id);
  }, [callId, rows, setCallId]);

  const selected = data.calls.find((c) => c.id === callId) ?? null;
  const customer = selected
    ? data.customers.find((c) => c.id === selected.customerId)
    : undefined;

  return (
    <>
      <PageHead title={dict.callsPage.title} sub={dict.callsPage.subtitle} />
      <div className={cn("calls", pane === "detail" && "calls--pane-detail")}>
        <CallList
          calls={rows}
          customers={data.customers}
          selectedId={callId}
          query={query}
          filter={filter}
          onQuery={setQuery}
          onFilter={setFilter}
          onSelect={(id) => {
            setCallId(id);
            setPane("detail");
          }}
        />
        <CallDetail
          call={selected}
          customer={customer}
          onBack={() => setPane("list")}
          onSummarize={(id, summary) => updateCall(id, { summary })}
        />
      </div>
    </>
  );
}
