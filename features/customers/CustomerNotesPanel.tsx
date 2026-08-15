"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { teamMemberAvatar, teamMemberById } from "@/lib/data/relations";
import { useI18n } from "@/hooks/useI18n";
import type { Customer, Note, TeamMember } from "@/types";

export type CustomerNotesPanelProps = {
  customer: Customer;
  notes: Note[];
  members: TeamMember[];
  currentName: string;
  noteText: string;
  onNoteText: (value: string) => void;
  onAdd: () => void;
};

export function CustomerNotesPanel({
  customer,
  notes,
  members,
  currentName,
  noteText,
  onNoteText,
  onAdd,
}: CustomerNotesPanelProps) {
  const { dict, t, fmt } = useI18n();

  return (
    <div className="tabpane">
      <div className="notes">
        {!notes.length ? (
          <p className="notes__empty">{dict.customers.noNotes}</p>
        ) : (
          notes.map((n) => {
            const author = teamMemberById(members, n.authorId);
            return (
              <div key={n.id} className="note">
                <div className="note__head">
                  <Avatar
                    name={author?.name ?? currentName}
                    color={teamMemberAvatar(members, n.authorId)}
                    size={26}
                  />
                  <b>{author?.name ?? currentName}</b>
                  <span className="note__time">{fmt.relTime(n.createdAt)}</span>
                </div>
                <p className="note__body">{n.body}</p>
              </div>
            );
          })
        )}
      </div>
      <form
        className="note-form"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
      >
        <textarea
          className="textarea"
          rows={3}
          placeholder={t("customers.addNotePlaceholder", { name: customer.name })}
          value={noteText}
          onChange={(e) => onNoteText(e.target.value)}
        />
        <Button type="submit" variant="primary" size="sm">
          {dict.customers.addNote}
        </Button>
      </form>
    </div>
  );
}
