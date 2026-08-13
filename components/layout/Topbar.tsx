"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { localizedPath } from "@/lib/i18n/navigation";
import { CommandSearch } from "./CommandSearch";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { FaceAvatar, Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";

export type TopbarProps = {
  onOpenNav: () => void;
};

export function Topbar({ onOpenNav }: TopbarProps) {
  const { t, fmt, dict } = useI18n();
  const { data, markNotificationRead, markAllNotificationsRead } = useData();
  const { resolved, toggleLightDark } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const { locale } = useI18n();

  const unreadN = data.notifications.filter((n) => !n.read).length;
  const unreadM = data.messages.filter((m) => m.unread).length;
  const user = data.currentUser;

  const [panel, setPanel] = useState<"notif" | "msg" | "user" | null>(null);
  const notifRef = useRef<HTMLButtonElement>(null);
  const msgRef = useRef<HTMLButtonElement>(null);
  const userRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 360 });

  const place = (el: HTMLElement | null, width = 360) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, r.right - width),
      window.innerWidth - width - 8,
    );
    setCoords({ top: r.bottom + 8, left, width });
  };

  useEffect(() => {
    if (!panel) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        notifRef.current?.contains(target) ||
        msgRef.current?.contains(target) ||
        userRef.current?.contains(target)
      ) {
        return;
      }
      const pop = document.querySelector(".panel-pop, .usermenu");
      if (pop && pop.contains(target)) return;
      setPanel(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [panel]);

  const typeIcon = useMemo(
    () =>
      ({
        deal: "briefcase",
        review: "star",
        task: "check-circle",
        customer: "user",
        system: "info",
      }) as const,
    [],
  );

  return (
    <header className="topbar">
      <IconButton
        className="hamburger"
        icon="list"
        size={22}
        tip={t("shell.openMenu")}
        onClick={onOpenNav}
      />

      <CommandSearch />

      <div className="topbar__actions">
        <LanguageSwitcher locale={locale} />

        <IconButton
          ref={notifRef}
          icon="bell"
          size={22}
          tip={t("shell.notifications")}
          count={unreadN}
          countLabel={fmt.digits(unreadN)}
          countTone="coral"
          aria-expanded={panel === "notif"}
          onClick={() => {
            place(notifRef.current);
            setPanel((p) => (p === "notif" ? null : "notif"));
          }}
        />

        <IconButton
          ref={msgRef}
          icon="message"
          size={22}
          tip={t("shell.messages")}
          count={unreadM}
          countLabel={fmt.digits(unreadM)}
          aria-expanded={panel === "msg"}
          onClick={() => {
            place(msgRef.current);
            setPanel((p) => (p === "msg" ? null : "msg"));
          }}
        />

        <span className="topbar__divider" aria-hidden="true" />

        <button
          ref={userRef}
          type="button"
          className="user"
          aria-label={t("shell.accountMenu")}
          aria-expanded={panel === "user"}
          onClick={() => {
            place(userRef.current, 248);
            setPanel((p) => (p === "user" ? null : "user"));
          }}
        >
          <span className="user__avatar">
            {user.avatar === "face" ? (
              <FaceAvatar size={40} />
            ) : (
              <Avatar name={user.name} color="indigo" size={40} />
            )}
          </span>
          <span className="user__meta">
            <span className="user__name">{user.name}</span>
            <span className="user__role">{user.role}</span>
          </span>
          <Icon name="chevron-down" size={16} className="user__caret" />
        </button>
      </div>

      {panel &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="popover is-open"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 90,
            }}
          >
            {panel === "notif" && (
              <div className="panel-pop">
                <header className="panel-pop__head">
                  <h3>{t("shell.notifications")}</h3>
                  <button
                    type="button"
                    className="panel-pop__link"
                    onClick={() => {
                      markAllNotificationsRead();
                      toast(t("shell.allNotificationsRead"), { type: "success" });
                    }}
                  >
                    {t("shell.markAllRead")}
                  </button>
                </header>
                <div className="panel-pop__list">
                  {data.notifications.length ? (
                    data.notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={cn("notif", !n.read && "is-unread")}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <span className={`notif__icon notif__icon--indigo`}>
                          <Icon name={typeIcon[n.type] || "info"} size={16} />
                        </span>
                        <div className="notif__body">
                          <p className="notif__title">{n.title}</p>
                          <p className="notif__desc">{n.desc}</p>
                          <span className="notif__time">{fmt.relTime(n.time)}</span>
                        </div>
                        {!n.read ? <span className="notif__dot" /> : null}
                      </button>
                    ))
                  ) : (
                    <div className="empty">
                      <div className="empty__icon">
                        <Icon name="bell" size={28} />
                      </div>
                      <p className="empty__title">{t("shell.caughtUpTitle")}</p>
                      <p className="empty__desc">{t("shell.caughtUpDesc")}</p>
                    </div>
                  )}
                </div>
                <footer className="panel-pop__foot">
                  <button
                    type="button"
                    className="panel-pop__all"
                    onClick={() => {
                      setPanel(null);
                      toast(t("shell.notificationCenter"), { type: "info" });
                    }}
                  >
                    {t("shell.viewAllNotifications")}
                  </button>
                </footer>
              </div>
            )}

            {panel === "msg" && (
              <div className="panel-pop">
                <header className="panel-pop__head">
                  <h3>{t("shell.messages")}</h3>
                  <button
                    type="button"
                    className="panel-pop__link"
                    onClick={() => {
                      /* mark all read via setData would need helper - toast for now */
                      toast(t("shell.markAllRead"), { type: "success" });
                    }}
                  >
                    {t("shell.markAllRead")}
                  </button>
                </header>
                <div className="panel-pop__list">
                  {data.messages.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={cn("msg", m.unread && "is-unread")}
                    >
                      <Avatar name={m.from} color={m.color} size={40} online={m.online} />
                      <div className="msg__body">
                        <div className="msg__top">
                          <span className="msg__name">{m.from}</span>
                          <span className="msg__time">{fmt.relTime(m.time)}</span>
                        </div>
                        <p className="msg__preview">{m.preview}</p>
                      </div>
                      {m.unread ? <span className="notif__dot" /> : null}
                    </button>
                  ))}
                </div>
                <footer className="panel-pop__foot">
                  <button
                    type="button"
                    className="panel-pop__all"
                    onClick={() => {
                      setPanel(null);
                      router.push(localizedPath(locale, "/inbox"));
                    }}
                  >
                    {t("shell.openInbox")}
                  </button>
                </footer>
              </div>
            )}

            {panel === "user" && (
              <div className="usermenu">
                <div className="usermenu__head">
                  {user.avatar === "face" ? (
                    <FaceAvatar size={40} />
                  ) : (
                    <Avatar name={user.name} color="indigo" size={40} />
                  )}
                  <div>
                    <p className="usermenu__name">{user.name}</p>
                    <p className="usermenu__mail">{user.email}</p>
                  </div>
                </div>
                <div className="menu__divider" />
                <button
                  type="button"
                  className="menu__item"
                  onClick={() => {
                    setPanel(null);
                    router.push(localizedPath(locale, "/settings"));
                  }}
                >
                  <Icon name="user" size={18} />
                  <span>{t("shell.yourProfile")}</span>
                </button>
                <button
                  type="button"
                  className="menu__item"
                  onClick={() => {
                    setPanel(null);
                    router.push(localizedPath(locale, "/settings"));
                  }}
                >
                  <Icon name="gear" size={18} />
                  <span>{dict.nav.settings}</span>
                </button>
                <button
                  type="button"
                  className="menu__item"
                  onClick={() => {
                    toggleLightDark();
                    setPanel(null);
                  }}
                >
                  <Icon name="moon" size={18} />
                  <span>
                    {resolved === "dark" ? t("shell.lightMode") : t("shell.darkMode")}
                  </span>
                </button>
                <button
                  type="button"
                  className="menu__item"
                  onClick={() => {
                    setPanel(null);
                    toast(dict.nav.help, { type: "info" });
                  }}
                >
                  <Icon name="help" size={18} />
                  <span>{dict.nav.help}</span>
                </button>
                <div className="menu__divider" />
                <button
                  type="button"
                  className="menu__item menu__item--danger"
                  onClick={() => {
                    setPanel(null);
                    toast(t("shell.loggedOut"), { type: "info" });
                  }}
                >
                  <Icon name="logout" size={18} />
                  <span>{t("shell.logOut")}</span>
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </header>
  );
}
