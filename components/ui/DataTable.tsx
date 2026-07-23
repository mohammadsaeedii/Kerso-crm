"use client";

import {
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/lib/icons";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { IconButton } from "./IconButton";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortVal?: (row: T) => string | number | null | undefined;
  align?: "left" | "center" | "right";
  nowrap?: boolean;
  width?: string;
  sortable?: boolean;
};

export type DataTableBulkAction<T> = {
  label: string;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick: (rows: T[]) => void;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  pageSize?: number;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  selectable?: boolean;
  bulkActions?: DataTableBulkAction<T>[];
  rowActions?: (row: T, anchor: HTMLElement) => void;
  rowClick?: (row: T) => void;
  searchKeys?: string[];
  search?: string;
  filter?: (row: T) => boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyIcon?: IconName;
  paginate?: boolean;
  rowId?: (row: T) => string;
  className?: string;
};

function defaultRowId<T>(row: T): string {
  const r = row as { id?: string | number };
  return String(r.id ?? "");
}

function cellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function pageButtonList(cur: number, pages: number): number[] {
  const set = new Set([1, pages, cur, cur - 1, cur + 1]);
  return [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
}

export function DataTable<T>({
  columns,
  rows: allRows,
  pageSize = 8,
  sortKey: initialSortKey = null,
  sortDir: initialSortDir = "asc",
  selectable = false,
  bulkActions = [],
  rowActions,
  rowClick,
  searchKeys,
  search = "",
  filter: predicate,
  emptyTitle,
  emptyDesc,
  emptyIcon = "search",
  paginate = true,
  rowId = defaultRowId,
  className,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const processed = useMemo(() => {
    let rows = allRows;
    if (predicate) rows = rows.filter(predicate);
    const q = search.trim().toLowerCase();
    if (q && searchKeys?.length) {
      rows = rows.filter((r) =>
        searchKeys.some((k) => {
          const v = cellValue(r, k);
          return String(v == null ? "" : v)
            .toLowerCase()
            .includes(q);
        }),
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      const dir = sortDir === "asc" ? 1 : -1;
      rows = rows.slice().sort((a, b) => {
        const va = col?.sortVal ? col.sortVal(a) : cellValue(a, sortKey);
        const vb = col?.sortVal ? col.sortVal(b) : cellValue(b, sortKey);
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === "number" && typeof vb === "number") {
          return (va - vb) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    return rows;
  }, [allRows, predicate, search, searchKeys, sortKey, sortDir, columns]);

  const total = processed.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const pageRows = processed.slice(start, start + pageSize);
  const showingTo = Math.min(start + pageSize, total);
  const allOnPageSelected =
    pageRows.length > 0 &&
    pageRows.every((r) => selected.has(rowId(r)));
  const selCount = selected.size;
  const colSpan =
    columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  const selectedRows = () =>
    processed.filter((r) => selected.has(rowId(r)));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => {
        const id = rowId(r);
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const onRowClick = (row: T, e: MouseEvent<HTMLTableRowElement>) => {
    if (!rowClick) return;
    const target = e.target as HTMLElement;
    if (target.closest(".td-check,.td-actions,.checkbox,button,a")) return;
    rowClick(row);
  };

  return (
    <div className={cn(className)}>
      {selectable && selCount > 0 ? (
        <div className="table__bulk">
          <span className="table__bulk-count">
            {t("common.table.selected", { count: selCount })}
          </span>
          <div className="table__bulk-actions">
            {bulkActions.map((a, i) => (
              <Button
                key={i}
                size="sm"
                variant={a.variant ?? "ghost"}
                icon={a.icon}
                onClick={() => a.onClick(selectedRows())}
              >
                {a.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              {t("common.table.clear")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {selectable ? (
                <th className="td-check">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                    <span />
                  </label>
                </th>
              ) : null}
              {columns.map((col) => {
                const sortable = col.sortable !== false && !!col.key;
                const isSort = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      col.align && `ta-${col.align}`,
                      sortable && "is-sortable",
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={
                      sortable ? () => toggleSort(col.key) : undefined
                    }
                  >
                    <span className="th__inner">
                      {col.label}
                      {sortable ? (
                        <span
                          className={cn("th__arrow", isSort && "is-on")}
                        >
                          <Icon
                            name={
                              isSort && sortDir === "desc"
                                ? "chevron-down"
                                : "chevron-up"
                            }
                            size={14}
                            stroke={2}
                          />
                        </span>
                      ) : null}
                    </span>
                  </th>
                );
              })}
              {rowActions ? <th className="td-actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((row) => {
                const id = rowId(row);
                const checked = selected.has(id);
                return (
                  <tr
                    key={id}
                    data-row-id={id}
                    className={cn(
                      checked && "is-selected",
                      rowClick && "is-clickable",
                    )}
                    onClick={(e) => onRowClick(row, e)}
                  >
                    {selectable ? (
                      <td className="td-check">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              toggleRow(id, e.target.checked)
                            }
                          />
                          <span />
                        </label>
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(col.align && `ta-${col.align}`)}
                        style={
                          col.nowrap
                            ? { whiteSpace: "nowrap" }
                            : undefined
                        }
                      >
                        {col.render
                          ? col.render(row)
                          : String(cellValue(row, col.key) ?? "")}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="td-actions">
                        <IconButton
                          icon="more-h"
                          size={18}
                          sm
                          tip={t("common.rowActions")}
                          aria-label={t("common.rowActions")}
                          onClick={(e) => {
                            e.stopPropagation();
                            rowActions(row, e.currentTarget);
                          }}
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="td-empty" colSpan={colSpan}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle ?? t("common.table.emptyTitle")}
                    desc={emptyDesc ?? t("common.table.emptyDesc")}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginate ? (
        <div className="table__foot">
          <span className="table__count">
            {total ? (
              <>
                {t("common.showing")}{" "}
                <b>
                  {start + 1}–{showingTo}
                </b>{" "}
                {t("common.of")} <b>{total}</b>
              </>
            ) : (
              t("common.table.zeroResults")
            )}
          </span>
          <div className="pagination">
            <button
              type="button"
              className="pg-btn"
              disabled={safePage === 1}
              aria-label={t("common.previousPage")}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Icon name="chevron-left" size={18} />
            </button>
            {(() => {
              const list = pageButtonList(safePage, pages);
              let prev = 0;
              const nodes: ReactNode[] = [];
              list.forEach((p) => {
                if (p - prev > 1) {
                  nodes.push(
                    <span key={`e-${p}`} className="pg-ellipsis">
                      …
                    </span>,
                  );
                }
                nodes.push(
                  <button
                    key={p}
                    type="button"
                    className={cn("pg-btn", p === safePage && "is-active")}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>,
                );
                prev = p;
              });
              return nodes;
            })()}
            <button
              type="button"
              className="pg-btn"
              disabled={safePage === pages}
              aria-label={t("common.nextPage")}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
