"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/ui/PageHead";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Stars } from "@/components/ui/Stars";
import { Segmented } from "@/components/ui/Segmented";
import { DonutChart } from "@/components/charts/DonutChart";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { CHART } from "@/components/charts/palette";
import { Icon } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { sentimentLabel } from "@/lib/data/labels";
import { getAppNow } from "@/lib/utils/time";
import type { Review } from "@/types";
import { cn } from "@/lib/utils/cn";

type SortKey = "recent" | "highest" | "lowest" | "helpful";

export function ReviewsPage() {
  const { dict, t, fmt } = useI18n();
  const { data, updateReview } = useData();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [rating, setRating] = useState("all");
  const [product, setProduct] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [helpfulOn, setHelpfulOn] = useState<Set<string>>(() => new Set());
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");

  const products = useMemo(
    () => Array.from(new Set(data.reviews.map((r) => r.product))),
    [data.reviews],
  );

  const filtered = useMemo(() => {
    let list = data.reviews.slice();
    if (rating !== "all") {
      list = list.filter((r) => r.rating === Number(rating));
    }
    if (product !== "all") {
      list = list.filter((r) => r.product === product);
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          r.body.toLowerCase().includes(needle) ||
          r.author.toLowerCase().includes(needle),
      );
    }
    list.sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating;
      if (sort === "lowest") return a.rating - b.rating;
      if (sort === "helpful") return b.helpful - a.helpful;
      return +b.date - +a.date;
    });
    return list;
  }, [data.reviews, rating, product, q, sort]);

  const avg =
    data.reviews.length === 0
      ? 0
      : data.reviews.reduce((a, r) => a + r.rating, 0) / data.reviews.length;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: data.reviews.filter((r) => r.rating === star).length,
  }));
  const maxDist = Math.max(1, ...dist.map((d) => d.count));

  const sentiment = [
    {
      name: sentimentLabel(dict, "positive"),
      value: data.reviews.filter((r) => r.sentiment === "positive").length,
      color: CHART.up,
    },
    {
      name: sentimentLabel(dict, "neutral"),
      value: data.reviews.filter((r) => r.sentiment === "neutral").length,
      color: CHART.warn,
    },
    {
      name: sentimentLabel(dict, "negative"),
      value: data.reviews.filter((r) => r.sentiment === "negative").length,
      color: CHART.down,
    },
  ];
  const positivePct = data.reviews.length
    ? Math.round((sentiment[0]!.value / data.reviews.length) * 100)
    : 0;

  const toggleHelpful = (r: Review) => {
    const on = helpfulOn.has(r.id);
    updateReview(r.id, { helpful: r.helpful + (on ? -1 : 1) });
    setHelpfulOn((prev) => {
      const next = new Set(prev);
      if (on) next.delete(r.id);
      else next.add(r.id);
      return next;
    });
  };

  const openReply = (r: Review) => {
    setReplyTarget(r);
    setReplyText(r.reply?.body ?? "");
    setReplyError("");
  };

  const postReply = () => {
    if (!replyTarget) return;
    if (!replyText.trim()) {
      setReplyError(dict.common.validation.required);
      return;
    }
    updateReview(replyTarget.id, {
      replied: true,
      reply: {
        author: data.currentUser.name,
        date: getAppNow(),
        body: replyText.trim(),
      },
    });
    setReplyTarget(null);
    toast(dict.reviews.replyPosted, { type: "success" });
  };

  return (
    <>
      <PageHead
        title={dict.reviews.title}
        sub={dict.reviews.sub}
        actions={
          <Button
            variant="primary"
            icon="send"
            onClick={() =>
              toast(dict.reviews.requestSent, { type: "success" })
            }
          >
            {dict.reviews.requestReviews}
          </Button>
        }
      />

      <Panel title={dict.reviews.overview} className="panel--summary">
        <div className="rv-summary">
          <div className="rv-score">
            <div className="rv-score__num">{fmt.digits(avg.toFixed(1))}</div>
            <Stars rating={Math.round(avg)} size={18} />
            <div className="rv-score__count">
              {t("reviews.reviewsCount", {
                count: fmt.digits(data.reviews.length),
              })}
            </div>
          </div>
          <div className="rv-dist">
            {dist.map((d) => (
              <div key={d.star} className="rv-dist__row">
                <span className="rv-dist__star">
                  {fmt.digits(d.star)}
                  <Icon name="star" size={12} />
                </span>
                <div className="rv-dist__track">
                  <div
                    className="rv-dist__fill"
                    style={{ width: `${(d.count / maxDist) * 100}%` }}
                  />
                </div>
                <span className="rv-dist__count">{fmt.digits(d.count)}</span>
              </div>
            ))}
          </div>
          <div className="rv-sentiment">
            <div className="donut-wrap donut-wrap--sm">
              <DonutChart
                data={sentiment}
                size={132}
                thickness={18}
                center={`${fmt.digits(positivePct)}%`}
                centerSub={t("charts.positive")}
              />
            </div>
            <ChartLegend
              items={sentiment.map((s) => ({
                name: s.name,
                color: s.color,
              }))}
            />
          </div>
        </div>
      </Panel>

      <div className="filterbar">
        <div className="filterbar__search">
          <Icon name="search" size={18} className="filterbar__searchicon" />
          <input
            className="input"
            placeholder={dict.reviews.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="filterbar__controls">
          <Segmented
            value={rating}
            onChange={setRating}
            options={[
              { value: "all", label: dict.common.all },
              { value: "5", label: "5★" },
              { value: "4", label: "4★" },
              { value: "3", label: "3★" },
              { value: "2", label: "2★" },
              { value: "1", label: "1★" },
            ]}
          />
          <label className="select-wrap">
            <select
              className="select"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              <option value="all">{dict.common.all}</option>
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="select-wrap">
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="recent">{dict.reviews.mostRecent}</option>
              <option value="highest">{dict.reviews.highestRated}</option>
              <option value="lowest">{dict.reviews.lowestRated}</option>
              <option value="helpful">{dict.reviews.mostHelpful}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rv-list">
        {filtered.map((r) => (
          <article key={r.id} className="review">
            <div className="review__head">
              <div className="review__author">
                <Avatar name={r.author} color={r.avatar} size={42} />
                <div>
                  <div className="review__name">
                    {r.author}{" "}
                    {r.verified ? (
                      <span
                        className="verified"
                        title={dict.reviews.verified}
                      >
                        <Icon name="check-circle" size={14} />
                      </span>
                    ) : null}
                  </div>
                  <div className="review__sub">
                    {r.company} · {fmt.date(r.date)}
                  </div>
                </div>
              </div>
              <div className="review__rt">
                <Stars rating={r.rating} />
              </div>
            </div>
            <h3 className="review__title">{r.title}</h3>
            <p className="review__body">{r.body}</p>
            <div className="review__foot">
              <span className="tagchip tagchip--neutral">{r.product}</span>
              <div className="review__actions">
                <button
                  type="button"
                  className={cn(
                    "review__helpful",
                    helpfulOn.has(r.id) && "is-on",
                  )}
                  onClick={() => toggleHelpful(r)}
                >
                  <Icon name="thumbs-up" size={16} />
                  <span>{dict.reviews.helpful}</span>{" "}
                  <b>{fmt.digits(r.helpful)}</b>
                </button>
                <Button
                  size="sm"
                  icon="send"
                  onClick={() => openReply(r)}
                >
                  {dict.reviews.reply}
                </Button>
              </div>
            </div>
            {r.reply ? (
              <div className="review__reply">
                <div className="review__reply-head">
                  <Avatar name={r.reply.author} color="indigo" size={26} />
                  <b>{r.reply.author}</b>
                  <span className="review__reply-badge">
                    {dict.reviews.kersoTeam}
                  </span>
                  <span className="note__time">
                    {fmt.relTime(r.reply.date)}
                  </span>
                </div>
                <p>{r.reply.body}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <Modal
        open={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title={dict.reviews.replyTitle}
        subtitle={
          replyTarget
            ? `${replyTarget.author} · ${fmt.digits(replyTarget.rating)}★`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button onClick={() => setReplyTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={postReply}>
              {dict.reviews.postReply}
            </Button>
          </>
        }
      >
        {replyTarget ? (
          <>
            <div className="reply-quote">
              <Stars rating={replyTarget.rating} size={14} />
              <p>{replyTarget.body}</p>
            </div>
            <Field
              as="textarea"
              label={dict.reviews.yourReply}
              name="reply"
              required
              rows={4}
              placeholder={dict.reviews.replyPlaceholder}
              value={replyText}
              error={replyError}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </>
        ) : null}
      </Modal>
    </>
  );
}
