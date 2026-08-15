"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/ui/PageHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/lib/icons";
import { CustomerForm } from "./CustomerForm";
import { CustomerOverview } from "./CustomerOverview";
import { CustomerNotesPanel } from "./CustomerNotesPanel";
import { CustomerActivityPanel } from "./CustomerActivityPanel";
import { CustomerEntityList } from "./CustomerEntityList";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { localizedPath } from "@/lib/i18n/navigation";
import {
  customerStatusLabel,
  dealStageLabel,
  dealStatusLabel,
} from "@/lib/data/labels";
import {
  companyName,
  dealsForCustomer,
  notesForCustomer,
  tasksForCustomer,
  teamMemberById,
  timelineForCustomer,
} from "@/lib/data/relations";
import { getAppNow } from "@/lib/utils/time";
import {
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormValues,
} from "@/lib/customers/form";
import type { Customer, TimelineEvent } from "@/types";

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const { locale, dict, t, fmt } = useI18n();
  const { data, updateCustomer, removeCustomer, addDeal, addNote } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const customer = data.customers.find((c) => c.id === customerId) ?? null;
  const [tab, setTab] = useState("ov");
  const [noteText, setNoteText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CustomerFormValues | null>(null);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const back = () => router.push(localizedPath(locale, "/customers"));
  const go = (path: string) => router.push(localizedPath(locale, path));

  if (!customer) {
    return (
      <>
        <PageHead
          title={dict.customers.title}
          actions={
            <Button icon="chevron-left" onClick={back}>
              {dict.customers.backToList}
            </Button>
          }
        />
        <EmptyState
          icon="users"
          title={dict.customers.noCustomers}
          desc={dict.customers.noCustomersDesc}
        />
      </>
    );
  }

  return (
    <CustomerDetailBody
      customer={customer}
      tab={tab}
      setTab={setTab}
      noteText={noteText}
      setNoteText={setNoteText}
      formOpen={formOpen}
      setFormOpen={setFormOpen}
      form={form}
      setForm={setForm}
      errors={errors}
      setErrors={setErrors}
      deleteOpen={deleteOpen}
      setDeleteOpen={setDeleteOpen}
      back={back}
      go={go}
      toast={toast}
      updateCustomer={updateCustomer}
      removeCustomer={removeCustomer}
      addDeal={addDeal}
      addNote={addNote}
    />
  );
}

type BodyProps = {
  customer: Customer;
  tab: string;
  setTab: (v: string) => void;
  noteText: string;
  setNoteText: (v: string) => void;
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  form: CustomerFormValues | null;
  setForm: (v: CustomerFormValues | null) => void;
  errors: CustomerFormErrors;
  setErrors: (v: CustomerFormErrors) => void;
  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  back: () => void;
  go: (path: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  addDeal: ReturnType<typeof useData>["addDeal"];
  addNote: ReturnType<typeof useData>["addNote"];
};

function CustomerDetailBody(props: BodyProps) {
  const { locale, dict, t, fmt } = useI18n();
  const { data } = useData();
  const customer = props.customer;
  const deals = dealsForCustomer(data.deals, customer.id);
  const notes = notesForCustomer(data.notes, customer.id);
  const tasks = tasksForCustomer(data.tasks, customer.id).filter((tk) => !tk.done);
  const convos = data.conversations
    .filter((c) => c.customerId === customer.id)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const tickets = data.tickets.filter((tk) => tk.customerId === customer.id);
  const timeline = timelineForCustomer(data.timeline, customer.id);
  const companyLabel = companyName(data.companies, customer.companyId);
  const owner = teamMemberById(data.teamMembers, customer.ownerId);

  const onTimeline = (event: TimelineEvent) => {
    if (event.type === "conversation_created" || event.type === "message_received") {
      props.go(`/inbox?conversation=${event.conversationId}`);
      return;
    }
    if (event.type === "ticket_created") {
      props.go(`/tickets?ticket=${event.ticketId}`);
      return;
    }
    if (event.type === "deal_created" || event.type === "deal_stage_changed") {
      props.go(`/dashboard?deal=${event.dealId}`);
      return;
    }
    if (event.type === "note_added") props.setTab("nt");
  };

  const openEdit = () => {
    props.setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      companyId: customer.companyId ?? "",
      status: customer.status,
      city: customer.city,
      country: customer.country,
    });
    props.setErrors({});
    props.setFormOpen(true);
  };

  const submitEdit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!props.form) return;
    const next = validateCustomerForm(props.form, dict.common.validation);
    props.setErrors(next);
    if (Object.keys(next).length) return;
    props.updateCustomer(customer.id, {
      name: props.form.name.trim(),
      email: props.form.email.trim(),
      phone: props.form.phone.trim(),
      companyId: props.form.companyId || undefined,
      status: props.form.status,
      city: props.form.city.trim() || "—",
      country: props.form.country.trim() || "—",
    });
    props.toast(dict.customers.customerUpdated, {
      type: "success",
      desc: props.form.name.trim(),
    });
    props.setFormOpen(false);
  };

  return (
    <>
      <PageHead
        title={customer.name}
        sub={companyLabel}
        actions={
          <div className="profile-page__actions">
            <Button icon="chevron-left" onClick={props.back}>
              {dict.customers.backToList}
            </Button>
            <Button icon="edit" onClick={openEdit}>
              {t("common.edit")}
            </Button>
            <Button
              variant="primary"
              icon="message"
              onClick={() => props.go(`/inbox?customer=${customer.id}`)}
            >
              {dict.customers.message}
            </Button>
          </div>
        }
      />

      <section className="profile-page">
        <div className="profile-page__id">
          <Avatar name={customer.name} color={customer.avatar} size={56} />
          <div>
            <Badge statusKey={customer.status}>
              {customerStatusLabel(dict, customer.status)}
            </Badge>
            <p className="page-sub">{customer.email}</p>
          </div>
        </div>

        <div className="drawer-quick">
          <a className="drawer-quick__btn" href={`mailto:${customer.email}`}>
            <Icon name="mail" size={18} />
            <span>{dict.customers.email}</span>
          </a>
          <button
            type="button"
            className="drawer-quick__btn"
            onClick={() => props.go(`/calls?customer=${customer.id}`)}
          >
            <Icon name="phone" size={18} />
            <span>{dict.customers.call}</span>
          </button>
          <button
            type="button"
            className="drawer-quick__btn"
            onClick={() => props.setTab("nt")}
          >
            <Icon name="edit" size={18} />
            <span>{dict.customers.note}</span>
          </button>
          <button
            type="button"
            className="drawer-quick__btn"
            onClick={() => {
              const row = props.addDeal({
                title: t("customers.newDealTitle", { name: customer.name }),
                customerId: customer.id,
                companyId: customer.companyId,
                ownerId: data.currentUser.id,
                value: 10000,
                stage: "lead",
                probability: 20,
                close: getAppNow(),
                status: "open",
              });
              props.setTab("dl");
              props.toast(dict.customers.dealCreated, {
                type: "success",
                desc: row.title,
              });
            }}
          >
            <Icon name="briefcase" size={18} />
            <span>{dict.customers.deal}</span>
          </button>
        </div>

        <div className="panel profile-page__panel">
          <Tabs
            value={props.tab}
            onChange={props.setTab}
            items={[
              { value: "ov", label: dict.customers.overview },
              { value: "dl", label: dict.customers.deals, count: deals.length },
              { value: "ac", label: dict.customers.activity },
              { value: "nt", label: dict.customers.notes, count: notes.length },
              {
                value: "cv",
                label: dict.customers.conversations,
                count: convos.length,
              },
              { value: "tk", label: dict.customers.tickets, count: tickets.length },
            ]}
          />
          {props.tab === "ov" ? (
            <CustomerOverview
              customer={customer}
              data={data}
              companyLabel={companyLabel}
              owner={owner}
              deals={deals}
              tasks={tasks}
              conversations={convos}
              timeline={timeline}
              onTimeline={onTimeline}
            />
          ) : null}
          {props.tab === "dl" ? (
            <div className="tabpane">
              <CustomerEntityList
                emptyIcon="briefcase"
                emptyTitle={dict.customers.noDealsYet}
                emptyDesc={dict.customers.noDealsDesc}
                onOpen={(id) => props.go(`/dashboard?deal=${id}`)}
                items={deals.map((d) => ({
                  id: d.id,
                  title: d.title,
                  sub: `${fmt.money(d.value)} · ${dealStageLabel(dict, d.stage)}`,
                  icon: "briefcase" as const,
                  badge: {
                    label: dealStatusLabel(dict, d.status),
                    statusKey: d.status,
                  },
                }))}
              />
            </div>
          ) : null}
          {props.tab === "ac" ? (
            <div className="tabpane">
              <CustomerActivityPanel
                events={timeline}
                data={data}
                onSelect={onTimeline}
              />
            </div>
          ) : null}
          {props.tab === "nt" ? (
            <CustomerNotesPanel
              customer={customer}
              notes={notes}
              members={data.teamMembers}
              currentName={data.currentUser.name}
              noteText={props.noteText}
              onNoteText={props.setNoteText}
              onAdd={() => {
                const v = props.noteText.trim();
                if (!v) return;
                props.addNote({
                  body: v,
                  customerId: customer.id,
                  companyId: customer.companyId,
                  authorId: data.currentUser.id,
                });
                props.setNoteText("");
                props.toast(dict.customers.noteAdded, { type: "success" });
              }}
            />
          ) : null}
          {props.tab === "cv" ? (
            <div className="tabpane">
              <CustomerEntityList
                emptyIcon="message"
                emptyTitle={dict.customers.noConversations}
                emptyDesc={dict.customers.noConversationsDesc}
                onOpen={(id) => props.go(`/inbox?conversation=${id}`)}
                items={convos.map((c) => ({
                  id: c.id,
                  title: c.subject,
                  sub: `${dict.inbox.status[c.status]} · ${fmt.relTime(c.updatedAt)}`,
                  icon: "message" as const,
                }))}
              />
            </div>
          ) : null}
          {props.tab === "tk" ? (
            <div className="tabpane">
              <CustomerEntityList
                emptyIcon="flag"
                emptyTitle={dict.customers.noTickets}
                emptyDesc={dict.customers.noTicketsDesc}
                onOpen={(id) => props.go(`/tickets?ticket=${id}`)}
                items={tickets.map((tk) => ({
                  id: tk.id,
                  title: tk.title,
                  sub: `${dict.ticketsPage.status[tk.status]} · ${fmt.relTime(tk.updatedAt)}`,
                  icon: "flag" as const,
                }))}
              />
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={props.formOpen}
        onClose={() => props.setFormOpen(false)}
        title={dict.customers.editCustomer}
        subtitle={customer.name}
        footer={
          <>
            <Button onClick={() => props.setFormOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={() => submitEdit()}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        {props.form ? (
          <CustomerForm
            value={props.form}
            errors={props.errors}
            companies={data.companies}
            statuses={data.CUST_STATUS}
            onChange={(patch) => props.setForm({ ...props.form!, ...patch })}
            onSubmit={(e) => submitEdit(e)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={props.deleteOpen}
        onClose={() => props.setDeleteOpen(false)}
        danger
        title={dict.customers.deleteTitle}
        message={t("customers.deleteMessage", { name: customer.name })}
        confirmText={t("common.delete")}
        onConfirm={() => {
          props.removeCustomer(customer.id);
          props.toast(dict.customers.customerDeleted, {
            type: "success",
            desc: customer.name,
          });
          props.back();
        }}
      />
    </>
  );
}
