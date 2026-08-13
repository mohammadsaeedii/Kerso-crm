import type { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";

export function DsSection({
  id,
  title,
  desc,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="ds-section">
      <Panel title={title} sub={desc}>
        {children}
      </Panel>
    </section>
  );
}
