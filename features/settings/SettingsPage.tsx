"use client";

import { useState, type FormEvent } from "react";
import { PageHead } from "@/components/ui/PageHead";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { FaceAvatar } from "@/components/ui/Avatar";
import { Icon } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useTheme, ACCENT_COLORS, type ThemePref } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";

type TabKey =
  | "profile"
  | "notifications"
  | "appearance"
  | "security"
  | "billing";

export function SettingsPage() {
  const { dict, t } = useI18n();
  const { data, setData } = useData();
  const { theme, accent, setTheme, setAccent } = useTheme();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState({
    name: data.currentUser.name,
    email: data.currentUser.email,
    role: data.currentUser.role,
    phone: "+1 (415) 555-0132",
    tz: dict.settings.timezones[0]!,
    lang: dict.settings.languages[0]!,
  });
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const [pwd, setPwd] = useState({ cur: "", next: "", confirm: "" });
  const [notifs, setNotifs] = useState([true, true, true, false, false, true]);
  const [twofa, setTwofa] = useState(true);
  const [sms, setSms] = useState(false);
  const [revoked, setRevoked] = useState<Set<number>>(() => new Set());

  const notifPrefs = [
    {
      title: dict.settings.notifNewDeals,
      desc: dict.settings.notifNewDealsDesc,
    },
    {
      title: dict.settings.notifReviews,
      desc: dict.settings.notifReviewsDesc,
    },
    {
      title: dict.settings.notifTasks,
      desc: dict.settings.notifTasksDesc,
    },
    {
      title: dict.settings.notifWeekly,
      desc: dict.settings.notifWeeklyDesc,
    },
    {
      title: dict.settings.notifProduct,
      desc: dict.settings.notifProductDesc,
    },
    {
      title: dict.settings.notifMentions,
      desc: dict.settings.notifMentionsDesc,
    },
  ];

  const saveProfile = (e?: FormEvent) => {
    e?.preventDefault();
    const errors: { name?: string; email?: string } = {};
    if (!profile.name.trim()) errors.name = dict.common.validation.required;
    if (!profile.email.trim()) errors.email = dict.common.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = dict.common.validation.invalidEmail;
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;
    setData((d) => ({
      ...d,
      currentUser: {
        ...d.currentUser,
        name: profile.name.trim(),
        email: profile.email.trim(),
        role: profile.role,
      },
    }));
    toast(dict.settings.profileSaved, { type: "success" });
  };

  const savePassword = () => {
    if (pwd.next && pwd.next !== pwd.confirm) {
      toast(dict.settings.passwordsMismatch, { type: "error" });
      return;
    }
    setPwd({ cur: "", next: "", confirm: "" });
    toast(dict.settings.passwordUpdated, { type: "success" });
  };

  return (
    <>
      <PageHead title={dict.settings.title} sub={dict.settings.sub} />

      <div className="tabbed tabbed--page">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
          items={[
            { value: "profile", label: dict.settings.profile },
            { value: "notifications", label: dict.settings.notifications },
            { value: "appearance", label: dict.settings.appearance },
            { value: "security", label: dict.settings.security },
            { value: "billing", label: dict.settings.billing },
          ]}
        />

        <div className="settings-panes">
          {tab === "profile" ? (
            <Panel
              title={dict.settings.profile}
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => saveProfile()}
                >
                  {t("common.save")}
                </Button>
              }
            >
              <div className="profile-head">
                <FaceAvatar size={72} />
                <div className="profile-head__main">
                  <h3>{data.currentUser.name}</h3>
                  <p>
                    {data.currentUser.role} · {data.currentUser.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  icon="upload"
                  onClick={() =>
                    toast(t("common.comingSoon"), { type: "info" })
                  }
                >
                  {dict.settings.changePhoto}
                </Button>
              </div>
              <form className="form-grid" onSubmit={saveProfile}>
                <Field
                  label={dict.settings.fullName}
                  name="name"
                  required
                  value={profile.name}
                  error={profileErrors.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <Field
                  label={dict.settings.email}
                  name="email"
                  type="email"
                  required
                  value={profile.email}
                  error={profileErrors.email}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                />
                <Field
                  label={dict.settings.role}
                  name="role"
                  value={profile.role}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, role: e.target.value }))
                  }
                />
                <Field
                  label={dict.settings.phone}
                  name="phone"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <Field
                  as="select"
                  label={dict.settings.timezone}
                  name="tz"
                  options={dict.settings.timezones}
                  value={profile.tz}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, tz: e.target.value }))
                  }
                />
                <Field
                  as="select"
                  label={dict.settings.language}
                  name="lang"
                  options={dict.settings.languages}
                  value={profile.lang}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, lang: e.target.value }))
                  }
                />
              </form>
            </Panel>
          ) : null}

          {tab === "notifications" ? (
            <Panel title={dict.settings.notifPrefs}>
              <ul className="pref-list">
                {notifPrefs.map((p, i) => (
                  <li key={p.title} className="pref">
                    <div className="pref__main">
                      <p className="pref__title">{p.title}</p>
                      <p className="pref__desc">{p.desc}</p>
                    </div>
                    <Toggle
                      name={`notif${i}`}
                      checked={notifs[i]}
                      onChange={(checked) => {
                        setNotifs((arr) => {
                          const next = [...arr];
                          next[i] = checked;
                          return next;
                        });
                        toast(dict.settings.preferenceSaved, {
                          type: "success",
                        });
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {tab === "appearance" ? (
            <>
              <Panel title={dict.settings.theme}>
                <div className="theme-pick">
                  {(
                    [
                      { v: "light", l: dict.settings.themeLight, i: "sun" as const },
                      { v: "dark", l: dict.settings.themeDark, i: "moon" as const },
                      {
                        v: "system",
                        l: dict.settings.themeSystem,
                        i: "palette" as const,
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      className={`theme-opt${theme === opt.v ? " is-active" : ""}`}
                      onClick={() => {
                        setTheme(opt.v as ThemePref);
                        toast(dict.settings.themeUpdated, {
                          type: "success",
                        });
                      }}
                    >
                      <span
                        className={`theme-opt__preview theme-opt__preview--${opt.v}`}
                      >
                        <Icon name={opt.i} size={18} />
                      </span>
                      <span>{opt.l}</span>
                    </button>
                  ))}
                </div>
              </Panel>
              <Panel
                title={dict.settings.accentColor}
                sub={dict.settings.accentSub}
              >
                <div className="accent-pick">
                  {ACCENT_COLORS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={`accent-dot${accent === a ? " is-active" : ""}`}
                      style={{ background: a, color: a }}
                      aria-label={a}
                      onClick={() => {
                        setAccent(a);
                        toast(t("shell.accentUpdated"), { type: "success" });
                      }}
                    >
                      {accent === a ? (
                        <Icon name="check" size={14} stroke={2.6} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </Panel>
            </>
          ) : null}

          {tab === "security" ? (
            <>
              <Panel
                title={dict.settings.password}
                actions={
                  <Button variant="primary" size="sm" onClick={savePassword}>
                    {dict.settings.updatePassword}
                  </Button>
                }
              >
                <form
                  className="form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    savePassword();
                  }}
                >
                  <Field
                    label={dict.settings.currentPassword}
                    name="cur"
                    type="password"
                    placeholder="••••••••"
                    value={pwd.cur}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, cur: e.target.value }))
                    }
                  />
                  <Field
                    label={dict.settings.newPassword}
                    name="new"
                    type="password"
                    placeholder="••••••••"
                    value={pwd.next}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, next: e.target.value }))
                    }
                  />
                  <Field
                    label={dict.settings.confirmPassword}
                    name="confirm"
                    type="password"
                    wide
                    placeholder="••••••••"
                    value={pwd.confirm}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, confirm: e.target.value }))
                    }
                  />
                </form>
              </Panel>

              <Panel title={dict.settings.twoFactor}>
                <ul className="pref-list">
                  <li className="pref">
                    <div className="pref__main">
                      <p className="pref__title">
                        {dict.settings.authenticator}
                      </p>
                      <p className="pref__desc">
                        {dict.settings.authenticatorDesc}
                      </p>
                    </div>
                    <Toggle
                      name="twofa"
                      checked={twofa}
                      onChange={(checked) => {
                        setTwofa(checked);
                        toast(dict.settings.preferenceSaved, {
                          type: "success",
                        });
                      }}
                    />
                  </li>
                  <li className="pref">
                    <div className="pref__main">
                      <p className="pref__title">{dict.settings.smsCodes}</p>
                      <p className="pref__desc">
                        {dict.settings.smsCodesDesc}
                      </p>
                    </div>
                    <Toggle
                      name="sms"
                      checked={sms}
                      onChange={(checked) => {
                        setSms(checked);
                        toast(dict.settings.preferenceSaved, {
                          type: "success",
                        });
                      }}
                    />
                  </li>
                </ul>
              </Panel>

              <Panel title={dict.settings.activeSessions}>
                <ul className="mini-list">
                  {dict.settings.sessions.map((s, i) => (
                    <li
                      key={s.device}
                      className="mini-list__item"
                      style={revoked.has(i) ? { opacity: 0.4 } : undefined}
                    >
                      <span className="mini-list__icon">
                        <Icon name="shield" size={16} />
                      </span>
                      <div className="mini-list__main">
                        <div className="cell-strong">{s.device}</div>
                        <div className="cell-sub">{s.meta}</div>
                      </div>
                      {i === 0 ? (
                        <Badge variant="success">
                          {dict.common.status.active}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={revoked.has(i)}
                          onClick={() => {
                            setRevoked((prev) => new Set(prev).add(i));
                            toast(dict.settings.sessionRevoked, {
                              type: "info",
                            });
                          }}
                        >
                          {revoked.has(i)
                            ? dict.settings.revoked
                            : dict.settings.revoke}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          ) : null}

          {tab === "billing" ? (
            <>
              <Panel title={dict.settings.currentPlan}>
                <div className="plan">
                  <div className="plan__main">
                    <span className="plan__badge">
                      {dict.settings.planBadge}
                    </span>
                    <h3 className="plan__price">
                      {dict.settings.planPrice}
                      <span>{dict.settings.planPerMonth}</span>
                    </h3>
                    <p className="plan__desc">{dict.settings.planDesc}</p>
                  </div>
                  <div className="plan__actions">
                    <Button size="sm">{dict.settings.changePlan}</Button>
                    <Button size="sm" variant="ghost">
                      {dict.settings.cancelPlan}
                    </Button>
                  </div>
                </div>
              </Panel>

              <Panel title={dict.settings.paymentMethod}>
                <div className="paycard">
                  <span className="paycard__icon">
                    <Icon name="credit-card" size={22} />
                  </span>
                  <div className="paycard__main">
                    <div className="cell-strong">
                      {dict.settings.visaEnding}
                    </div>
                    <div className="cell-sub">{dict.settings.expires}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      toast(t("common.comingSoon"), { type: "info" })
                    }
                  >
                    {dict.settings.update}
                  </Button>
                </div>
              </Panel>

              <Panel title={dict.settings.billingHistory} flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{dict.settings.period}</th>
                        <th>{dict.settings.amount}</th>
                        <th>{dict.dashboard.status}</th>
                        <th className="ta-right">{dict.settings.invoice}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dict.settings.invoices.map((iv) => (
                        <tr key={iv.period}>
                          <td>{iv.period}</td>
                          <td>{iv.amount}</td>
                          <td>
                            <Badge variant="success">
                              {dict.common.status.paid}
                            </Badge>
                          </td>
                          <td className="ta-right">
                            <Button
                              size="sm"
                              icon="download"
                              onClick={() =>
                                toast(dict.settings.invoiceDownloaded, {
                                  type: "success",
                                })
                              }
                            >
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
