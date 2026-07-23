import type { ReactNode } from "react";

export type PageHeadProps = {
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
};

export function PageHead({ title, sub, actions }: PageHeadProps) {
  return (
    <div className="page-head">
      <div className="page-head__titles">
        <h1 className="page-title">{title}</h1>
        {sub ? <p className="page-sub">{sub}</p> : null}
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </div>
  );
}
