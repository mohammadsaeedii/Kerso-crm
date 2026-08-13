"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { DsSection } from "./DsSection";

export function OverlaysSection() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <DsSection id="overlays" title={t("designSystem.sections.overlays")}>
      <div className="ds-row">
        <Button variant="primary" icon="plus" onClick={() => setModal(true)}>
          {t("designSystem.openModal")}
        </Button>
        <Button variant="secondary" icon="user" onClick={() => setDrawer(true)}>
          {t("designSystem.openDrawer")}
        </Button>
        <Button variant="danger" icon="trash" onClick={() => setConfirm(true)}>
          {t("designSystem.openConfirm")}
        </Button>
        <Button
          variant="ghost"
          icon="bell"
          onClick={() =>
            toast(t("designSystem.toastTitle"), {
              type: "success",
              desc: t("designSystem.toastDesc"),
            })
          }
        >
          {t("designSystem.showToast")}
        </Button>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t("designSystem.modalTitle")}
        subtitle={t("designSystem.modalSub")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={() => setModal(false)}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <p className="confirm__msg">{t("designSystem.modalBody")}</p>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title={t("designSystem.drawerTitle")}
        footer={
          <Button variant="secondary" onClick={() => setDrawer(false)}>
            {t("common.close")}
          </Button>
        }
      >
        <p className="drawer-desc">{t("designSystem.drawerBody")}</p>
      </Drawer>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() =>
          toast(t("designSystem.toastTitle"), { type: "success" })
        }
        title={t("designSystem.confirmTitle")}
        message={t("designSystem.confirmMessage")}
        danger
      />
    </DsSection>
  );
}
