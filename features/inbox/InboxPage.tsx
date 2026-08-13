"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { useRecordQuery } from "@/hooks/useRecordQuery";
import { Icon } from "@/lib/icons";
import { localizedPath } from "@/lib/i18n/navigation";
import { companyName, teamMemberName } from "@/lib/data/relations";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { ConversationStatus, MessageRole } from "@/types";

type InboxFilter = "all" | "open" | "mine" | "unassigned" | "closed";
type ComposerMode = "reply" | "note";
type MobilePane = "list" | "thread" | "context";

const STATUS_VARIANT: Record<ConversationStatus, string> = {
  open: "success",
  pending: "warning",
  closed: "neutral",
};

export function InboxPage({
  initialConversation = null,
  initialCustomer = null,
}: {
  initialConversation?: string | null;
  initialCustomer?: string | null;
}) {
  const { locale, t, fmt, dict } = useI18n();
  const { data, updateConversation, appendMessage } = useData();
  const { toast } = useToast();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [conversationId, setConversationId] = useRecordQuery(
    "conversation",
    initialConversation,
  );
  const [customerParam] = useRecordQuery("customer", initialCustomer);
  const [composerMode, setComposerMode] = useState<ComposerMode>("reply");
  const [draft, setDraft] = useState("");
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [contextOpen, setContextOpen] = useState(true);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const agentName = data.currentUser.name;
  const aiName = data.aiAgent.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.conversations
      .filter((c) => {
        if (filter === "open") return c.status === "open";
        if (filter === "closed") return c.status === "closed";
        if (filter === "mine") return c.assignee === agentName;
        if (filter === "unassigned") return !c.assignee;
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        const cust = data.customers.find((x) => x.id === c.customerId);
        return (
          c.subject.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          cust?.name.toLowerCase().includes(q) ||
          companyName(data.companies, cust?.companyId, "")
            .toLowerCase()
            .includes(q)
        );
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [data.conversations, data.customers, data.companies, filter, query, agentName]);

  useEffect(() => {
    if (conversationId && data.conversations.some((c) => c.id === conversationId)) {
      return;
    }
    if (customerParam) {
      const first = data.conversations.find((c) => c.customerId === customerParam);
      if (first) setConversationId(first.id);
      return;
    }
    if (filtered[0]) setConversationId(filtered[0].id);
  }, [
    conversationId,
    customerParam,
    data.conversations,
    filtered,
    setConversationId,
  ]);

  const selected = data.conversations.find((c) => c.id === conversationId) ?? null;
  const customer = selected
    ? data.customers.find((c) => c.id === selected.customerId) ?? null
    : null;

  const customerConversations = useMemo(() => {
    if (!customer) return [];
    return data.conversations
      .filter((c) => c.customerId === customer.id)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [data.conversations, customer]);

  const customerTickets = useMemo(() => {
    if (!customer) return [];
    return data.tickets.filter((t) => t.customerId === customer.id);
  }, [data.tickets, customer]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length, conversationId]);

  const counts = useMemo(() => {
    const all = data.conversations.length;
    const open = data.conversations.filter((c) => c.status === "open").length;
    const mine = data.conversations.filter((c) => c.assignee === agentName).length;
    const unassigned = data.conversations.filter((c) => !c.assignee).length;
    const closed = data.conversations.filter((c) => c.status === "closed").length;
    return { all, open, mine, unassigned, closed };
  }, [data.conversations, agentName]);

  const selectConversation = (id: string) => {
    setConversationId(id);
    setMobilePane("thread");
    updateConversation(id, { unread: false });
  };

  const send = () => {
    if (!selected || !draft.trim()) return;
    if (composerMode === "note") {
      appendMessage(selected.id, {
        role: "note",
        authorName: agentName,
        body: draft.trim(),
        time: new Date(),
      });
      toast(t("inbox.noteAdded"), { type: "success" });
    } else {
      appendMessage(selected.id, {
        role: "agent",
        authorName: agentName,
        body: draft.trim(),
        time: new Date(),
      });
      if (!selected.assignee) {
        updateConversation(selected.id, { assignee: agentName });
      }
      toast(t("inbox.sent"), { type: "success" });
    }
    setDraft("");
  };

  const applyAiSuggestion = () => {
    setComposerMode("reply");
    setDraft(t("inbox.aiSuggestBody"));
  };

  const filterItems: { id: InboxFilter; label: string; count: number }[] = [
    { id: "all", label: dict.inbox.filters.all, count: counts.all },
    { id: "open", label: dict.inbox.filters.open, count: counts.open },
    { id: "mine", label: dict.inbox.filters.mine, count: counts.mine },
    { id: "unassigned", label: dict.inbox.filters.unassigned, count: counts.unassigned },
    { id: "closed", label: dict.inbox.filters.closed, count: counts.closed },
  ];

  return (
    <div
      className={cn(
        "inbox",
        `inbox--pane-${mobilePane}`,
        contextOpen && "inbox--context-open",
      )}
    >
      {/* Filters */}
      <aside className="inbox__filters">
        <div className="inbox__filters-head">
          <h1 className="inbox__title">{dict.inbox.title}</h1>
          <p className="inbox__open-count">
            {t("inbox.openCount", { count: String(counts.open) })}
          </p>
        </div>
        <ul className="inbox-filter-list">
          {filterItems.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={cn("inbox-filter", filter === f.id && "is-active")}
                onClick={() => {
                  setFilter(f.id);
                  setMobilePane("list");
                }}
              >
                <span>{f.label}</span>
                <span className="inbox-filter__count">{fmt.num(f.count)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Conversation list */}
      <section className="inbox__list" aria-label={dict.inbox.title}>
        <div className="inbox__list-head">
          <div className="inbox-search">
            <Icon name="search" size={16} className="inbox-search__icon" />
            <input
              className="inbox-search__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.inbox.search}
              aria-label={dict.inbox.search}
            />
          </div>
        </div>
        <div className="inbox__list-body">
          {filtered.length === 0 ? (
            <div className="inbox-empty">
              <p className="inbox-empty__title">{dict.inbox.empty}</p>
              <p className="inbox-empty__desc">{dict.inbox.emptyDesc}</p>
            </div>
          ) : (
            filtered.map((c) => {
              const cust = data.customers.find((x) => x.id === c.customerId);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "conv-row",
                    conversationId === c.id && "is-active",
                    c.unread && "is-unread",
                  )}
                  onClick={() => selectConversation(c.id)}
                >
                  <Avatar
                    name={cust?.name ?? "?"}
                    color={cust?.avatar ?? "slate"}
                    size={40}
                  />
                  <div className="conv-row__main">
                    <div className="conv-row__top">
                      <span className="conv-row__name">{cust?.name ?? "—"}</span>
                      <time className="conv-row__time">{fmt.relTime(c.updatedAt)}</time>
                    </div>
                    <p className="conv-row__subject">{c.subject}</p>
                    <p className="conv-row__preview">{c.preview}</p>
                    <div className="conv-row__meta">
                      <Badge variant={STATUS_VARIANT[c.status]}>
                        {dict.inbox.status[c.status]}
                      </Badge>
                      <span className="conv-row__channel">
                        {dict.inbox.channel[c.channel]}
                      </span>
                      {c.aiHandled && (
                        <span className="conv-row__ai" title={aiName}>
                          <Icon name="sparkles" size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Thread */}
      <section className="inbox__thread" aria-label={selected?.subject}>
        {!selected || !customer ? (
          <div className="inbox-empty inbox-empty--center">
            <div className="inbox-empty__icon">
              <Icon name="message" size={28} />
            </div>
            <p className="inbox-empty__title">{dict.inbox.select}</p>
            <p className="inbox-empty__desc">{dict.inbox.selectDesc}</p>
          </div>
        ) : (
          <>
            <header className="thread-head">
              <button
                type="button"
                className="thread-head__back"
                onClick={() => setMobilePane("list")}
                aria-label={dict.inbox.back}
              >
                <Icon name="chevron-left" size={20} />
              </button>
              <div className="thread-head__main">
                <h2 className="thread-head__title">{selected.subject}</h2>
                <p className="thread-head__sub">
                  {customer.name} · {dict.inbox.channel[selected.channel]} ·{" "}
                  {selected.assignee ?? dict.inbox.unassigned}
                </p>
              </div>
              <div className="thread-head__actions">
                {!selected.assignee && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      updateConversation(selected.id, { assignee: agentName });
                      toast(t("inbox.assigned"), { type: "success" });
                    }}
                  >
                    {dict.inbox.assignToMe}
                  </Button>
                )}
                {selected.status !== "closed" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      updateConversation(selected.id, { status: "closed" });
                      toast(t("inbox.closed"), { type: "success" });
                    }}
                  >
                    {dict.inbox.markClosed}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      updateConversation(selected.id, { status: "open" });
                      toast(t("inbox.reopened"), { type: "success" });
                    }}
                  >
                    {dict.inbox.markOpen}
                  </Button>
                )}
                <button
                  type="button"
                  className="icon-btn icon-btn--sm thread-head__context-btn"
                  onClick={() => {
                    setContextOpen((v) => !v);
                    setMobilePane("context");
                  }}
                  aria-label={dict.inbox.showContext}
                >
                  <Icon name="panel-right" size={18} />
                </button>
              </div>
            </header>

            <div className="thread-body">
              {selected.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  author={m.authorName}
                  body={m.body}
                  time={fmt.relTime(m.time)}
                  roleLabel={dict.inbox.role[m.role]}
                />
              ))}
              <div ref={threadEndRef} />
            </div>

            <footer className="composer">
              <div
                className="composer__modes"
                role="tablist"
                aria-label={dict.inbox.composerModes}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={composerMode === "reply"}
                  className={cn("composer__mode", composerMode === "reply" && "is-active")}
                  onClick={() => setComposerMode("reply")}
                >
                  {dict.inbox.reply}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={composerMode === "note"}
                  className={cn("composer__mode", composerMode === "note" && "is-active")}
                  onClick={() => setComposerMode("note")}
                >
                  {dict.inbox.note}
                </button>
              </div>
              <textarea
                className={cn(
                  "composer__input",
                  composerMode === "note" && "composer__input--note",
                )}
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  composerMode === "note"
                    ? dict.inbox.notePlaceholder
                    : dict.inbox.replyPlaceholder
                }
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <div className="composer__bar">
                <div className="composer__tools">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      toast(dict.inbox.attach, { type: "info", desc: dict.common.comingSoon })
                    }
                  >
                    <Icon name="paperclip" size={16} />
                    {dict.inbox.attach}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={applyAiSuggestion}
                  >
                    <Icon name="sparkles" size={16} />
                    {dict.inbox.aiSuggest}
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!draft.trim()}
                  onClick={send}
                  icon="send"
                >
                  {dict.inbox.send}
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* Customer context */}
      <aside className={cn("inbox__context", !contextOpen && "is-collapsed")}>
        {customer && selected ? (
          <>
            <header className="ctx-head">
              <button
                type="button"
                className="thread-head__back"
                onClick={() => setMobilePane("thread")}
                aria-label={dict.inbox.back}
              >
                <Icon name="chevron-left" size={20} />
              </button>
              <h3>{dict.inbox.context}</h3>
              <button
                type="button"
                className="icon-btn icon-btn--sm ctx-head__close"
                onClick={() => {
                  setContextOpen(false);
                  setMobilePane("thread");
                }}
                aria-label={dict.inbox.hideContext}
              >
                <Icon name="x" size={16} />
              </button>
            </header>
            <div className="ctx-profile">
              <Avatar name={customer.name} color={customer.avatar} size={56} />
              <p className="ctx-profile__name">{customer.name}</p>
              <p className="ctx-profile__company">
                {companyName(data.companies, customer.companyId)}
              </p>
              <Link
                href={localizedPath(locale, `/customers?customer=${customer.id}`)}
                className="link ctx-profile__link"
              >
                {dict.customers.viewProfile}
              </Link>
            </div>
            <div className="ctx-section">
              <h4 className="ctx-section__title">{dict.inbox.attributes}</h4>
              <dl className="ctx-attrs">
                <div>
                  <dt>
                    <Icon name="mail" size={14} /> {dict.customers.email}
                  </dt>
                  <dd>{customer.email}</dd>
                </div>
                <div>
                  <dt>
                    <Icon name="phone" size={14} /> {dict.customers.phone}
                  </dt>
                  <dd>{customer.phone}</dd>
                </div>
                <div>
                  <dt>
                    <Icon name="map-pin" size={14} /> {dict.customers.city}
                  </dt>
                  <dd>
                    {customer.city}, {customer.country}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Icon name="user" size={14} /> {dict.customers.owner}
                  </dt>
                  <dd>{teamMemberName(data.teamMembers, customer.ownerId)}</dd>
                </div>
              </dl>
            </div>
            <div className="ctx-section">
              <h4 className="ctx-section__title">{dict.customers.tags}</h4>
              <div className="chips">
                {customer.tags.map((tag) => (
                  <span key={tag} className="tagchip tagchip--indigo">
                    {dict.common.tag[tag]}
                  </span>
                ))}
                {selected.tags.map((tag) => (
                  <span key={tag} className="tagchip tagchip--neutral">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="ctx-section">
              <h4 className="ctx-section__title">{dict.inbox.previous}</h4>
              <ul className="ctx-list">
                {customerConversations.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={cn("ctx-list__item", c.id === selected.id && "is-active")}
                      onClick={() => selectConversation(c.id)}
                    >
                      <span className="ctx-list__title">{c.subject}</span>
                      <span className="ctx-list__meta">{fmt.relTime(c.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ctx-section">
              <h4 className="ctx-section__title">{dict.inbox.tickets}</h4>
              {customerTickets.length === 0 ? (
                <p className="ctx-muted">{dict.ticketsPage.empty}</p>
              ) : (
                <ul className="ctx-list">
                  {customerTickets.map((tk) => (
                    <li key={tk.id}>
                      <Link
                        href={localizedPath(locale, `/tickets?ticket=${tk.id}`)}
                        className="ctx-list__item"
                      >
                        <span className="ctx-list__title">{tk.title}</span>
                        <span className="ctx-list__meta">
                          {dict.ticketsPage.status[tk.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="inbox-empty inbox-empty--center">
            <p className="inbox-empty__desc">{dict.inbox.selectDesc}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function MessageBubble({
  role,
  author,
  body,
  time,
  roleLabel,
}: {
  role: MessageRole;
  author: string;
  body: string;
  time: string;
  roleLabel: string;
}) {
  return (
    <div className={cn("bubble", `bubble--${role}`)}>
      <div className="bubble__meta">
        <span className="bubble__author">{author}</span>
        <span className="bubble__role">{roleLabel}</span>
        <time className="bubble__time">{time}</time>
      </div>
      <div className="bubble__body">{body}</div>
    </div>
  );
}
