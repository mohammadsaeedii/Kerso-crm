"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { useRecordQuery } from "@/hooks/useRecordQuery";
import { localizedPath } from "@/lib/i18n/navigation";
import type { Priority, TicketStatus } from "@/types";

const STATUS_VARIANT: Record<TicketStatus, string> = {
  open: "info",
  in_progress: "indigo",
  waiting: "warning",
  resolved: "success",
  closed: "neutral",
};

export function TicketsPage({
  initialTicketId = null,
}: {
  initialTicketId?: string | null;
}) {
  const { locale, dict, t, fmt } = useI18n();
  const { data, updateTicket, addTicket } = useData();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [selectedId, setSelectedId] = useRecordQuery("ticket", initialTicketId);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const statusKeys = Object.keys(dict.ticketsPage.status) as TicketStatus[];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tickets
      .filter((tk) => (status === "all" ? true : tk.status === status))
      .filter((tk) => (priority === "all" ? true : tk.priority === priority))
      .filter((tk) => {
        if (!q) return true;
        const cust = data.customers.find((c) => c.id === tk.customerId);
        return (
          tk.title.toLowerCase().includes(q) ||
          tk.id.toLowerCase().includes(q) ||
          (cust?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [data.tickets, data.customers, query, status, priority]);

  const selected = data.tickets.find((tk) => tk.id === selectedId) ?? null;
  const selectedCustomer = selected
    ? data.customers.find((c) => c.id === selected.customerId)
    : null;

  return (
    <>
      <PageHead
        title={dict.ticketsPage.title}
        sub={dict.ticketsPage.subtitle}
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
            {dict.ticketsPage.new}
          </Button>
        }
      />

      <div className="filterbar">
        <div className="filterbar__search">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.ticketsPage.search}
          />
        </div>
        <div className="filterbar__controls">
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">{dict.ticketsPage.allStatuses}</option>
            {statusKeys.map((s) => (
              <option key={s} value={s}>
                {dict.ticketsPage.status[s]}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">{dict.ticketsPage.allPriorities}</option>
            <option value="high">{dict.common.priority.high}</option>
            <option value="medium">{dict.common.priority.medium}</option>
            <option value="low">{dict.common.priority.low}</option>
          </select>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div className="empty">
            <p className="empty__title">{dict.ticketsPage.empty}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{dict.ticketsPage.colTitle}</th>
                <th>{dict.ticketsPage.customer}</th>
                <th>{dict.ticketsPage.colStatus}</th>
                <th>{dict.ticketsPage.colPriority}</th>
                <th>{dict.ticketsPage.assignee}</th>
                <th>{dict.ticketsPage.updated}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tk) => {
                const cust = data.customers.find((c) => c.id === tk.customerId);
                return (
                  <tr
                    key={tk.id}
                    className="is-clickable"
                    onClick={() => setSelectedId(tk.id)}
                  >
                    <td>{tk.id}</td>
                    <td>
                      <strong>{tk.title}</strong>
                    </td>
                    <td>{cust?.name ?? "—"}</td>
                    <td>
                      <Badge variant={STATUS_VARIANT[tk.status]}>
                        {dict.ticketsPage.status[tk.status]}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        variant={
                          tk.priority === "high"
                            ? "danger"
                            : tk.priority === "medium"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {dict.common.priority[tk.priority]}
                      </Badge>
                    </td>
                    <td>{tk.assignee}</td>
                    <td>{fmt.relTime(tk.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.title}>
        {selected && (
          <div className="stack-gap">
            <p className="page-sub">{selected.description}</p>
            <Field
              as="select"
              label={dict.ticketsPage.allStatuses}
              value={selected.status}
              options={statusKeys.map((s) => ({
                value: s,
                label: dict.ticketsPage.status[s],
              }))}
              onChange={(e) => {
                updateTicket(selected.id, {
                  status: e.target.value as TicketStatus,
                });
                toast(t("ticketsPage.statusUpdated"), { type: "success" });
              }}
            />
            <dl className="ctx-attrs">
              <div>
                <dt>{dict.ticketsPage.customer}</dt>
                <dd>
                  {selectedCustomer ? (
                    <Link
                      className="link"
                      href={localizedPath(
                        locale,
                        `/customers?customer=${selectedCustomer.id}`,
                      )}
                    >
                      {selectedCustomer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>{dict.ticketsPage.assignee}</dt>
                <dd>{selected.assignee}</dd>
              </div>
              <div>
                <dt>{dict.ticketsPage.updated}</dt>
                <dd>{fmt.date(selected.updatedAt)}</dd>
              </div>
            </dl>
            <div className="chips">
              {selected.tags.map((tag) => (
                <span key={tag} className="tagchip tagchip--indigo">
                  {tag}
                </span>
              ))}
            </div>
            {selected.conversationId ? (
              <Link
                className="btn btn--secondary btn--sm"
                href={localizedPath(
                  locale,
                  `/inbox?conversation=${selected.conversationId}`,
                )}
              >
                {dict.ticketsPage.openConversation}
              </Link>
            ) : null}
          </div>
        )}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={dict.ticketsPage.new}
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>{dict.common.cancel}</Button>
            <Button
              variant="primary"
              disabled={!title.trim()}
              onClick={() => {
                const customer = data.customers[0]!;
                addTicket({
                  title: title.trim(),
                  description: description.trim() || title.trim(),
                  customerId: customer.id,
                  conversationId: null,
                  status: "open",
                  priority: "medium" as Priority,
                  assignee: data.currentUser.name,
                  tags: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                setTitle("");
                setDescription("");
                setCreateOpen(false);
                toast(t("ticketsPage.created"), { type: "success" });
              }}
            >
              {dict.common.add}
            </Button>
          </>
        }
      >
        <Field
          label={dict.knowledgePage.titleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Field
          as="textarea"
          label={dict.knowledgePage.bodyLabel}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Modal>
    </>
  );
}
