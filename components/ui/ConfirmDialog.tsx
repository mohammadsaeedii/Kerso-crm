"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  danger = false,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? t("common.areYouSure")}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelText ?? t("common.cancel")}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            className={danger ? "btn--primary" : undefined}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText ?? t("common.confirm")}
          </Button>
        </>
      }
    >
      {message != null ? <p className="confirm__msg">{message}</p> : null}
    </Modal>
  );
}
