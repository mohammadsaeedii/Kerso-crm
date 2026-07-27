"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/ui/PageHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import type { KbArticleStatus } from "@/types";

export function KnowledgePage() {
  const { dict, t, fmt } = useI18n();
  const { data, updateKbArticle, addKbArticle } = useData();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.kbArticles
      .filter((a) => (status === "all" ? true : a.status === status))
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q),
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [data.kbArticles, query, status]);

  const selected = data.kbArticles.find((a) => a.id === selectedId) ?? null;

  return (
    <>
      <PageHead
        title={dict.knowledgePage.title}
        sub={dict.knowledgePage.subtitle}
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
            {dict.knowledgePage.new}
          </Button>
        }
      />

      <div className="filterbar">
        <div className="filterbar__search">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.knowledgePage.search}
          />
        </div>
        <div className="filterbar__controls">
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: dict.knowledgePage.all },
              { value: "published", label: dict.knowledgePage.published },
              { value: "draft", label: dict.knowledgePage.draft },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p className="empty__title">{dict.knowledgePage.empty}</p>
        </div>
      ) : (
        <div className="kb-grid">
          {rows.map((article) => (
            <button
              key={article.id}
              type="button"
              className="kb-card"
              onClick={() => setSelectedId(article.id)}
            >
              <div className="kb-card__top">
                <Badge variant={article.status === "published" ? "success" : "warning"}>
                  {article.status === "published"
                    ? dict.knowledgePage.published
                    : dict.knowledgePage.draft}
                </Badge>
                <span className="kb-card__views">
                  {t("knowledgePage.views", { count: article.views })}
                </span>
              </div>
              <h3 className="kb-card__title">{article.title}</h3>
              <p className="kb-card__excerpt">{article.excerpt}</p>
              <div className="kb-card__foot">
                <span>{article.category}</span>
                <span>{article.collection}</span>
                <span>{fmt.relTime(article.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.title}
        footer={
          selected ? (
            <Button
              variant="primary"
              onClick={() => {
                const next: KbArticleStatus =
                  selected.status === "published" ? "draft" : "published";
                updateKbArticle(selected.id, { status: next });
                toast(t("knowledgePage.statusUpdated"), { type: "success" });
              }}
            >
              {selected.status === "published"
                ? dict.knowledgePage.unpublish
                : dict.knowledgePage.publish}
            </Button>
          ) : null
        }
      >
        {selected && (
          <div className="stack-gap">
            <p className="page-sub">{selected.excerpt}</p>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selected.body}</p>
            <dl className="ctx-attrs">
              <div>
                <dt>{dict.knowledgePage.category}</dt>
                <dd>{selected.category}</dd>
              </div>
              <div>
                <dt>{dict.knowledgePage.collection}</dt>
                <dd>{selected.collection}</dd>
              </div>
              <div>
                <dt>{dict.knowledgePage.updated}</dt>
                <dd>{fmt.date(selected.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={dict.knowledgePage.new}
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>{dict.common.cancel}</Button>
            <Button
              variant="primary"
              disabled={!title.trim()}
              onClick={() => {
                addKbArticle({
                  title: title.trim(),
                  excerpt: excerpt.trim() || title.trim(),
                  body: body.trim() || excerpt.trim() || title.trim(),
                  category: dict.knowledgePage.category,
                  collection: dict.knowledgePage.collection,
                  status: "draft",
                  updatedAt: new Date(),
                  views: 0,
                });
                setTitle("");
                setExcerpt("");
                setBody("");
                setCreateOpen(false);
                toast(t("knowledgePage.created"), { type: "success" });
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
          label={dict.knowledgePage.excerptLabel}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
        <Field
          as="textarea"
          label={dict.knowledgePage.bodyLabel}
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Modal>
    </>
  );
}
