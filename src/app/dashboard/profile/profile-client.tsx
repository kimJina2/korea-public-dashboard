"use client";

import { useState, useRef, useCallback } from "react";
import { handleSignOut } from "@/app/actions";
import type { UserProfile } from "@/lib/user-profile";
import { LANG_NAMES, LANG_FLAGS, type Lang } from "@/lib/i18n";
import { useLanguage } from "@/contexts/language-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type CurrentUser = { email: string; name: string | null; image: string | null };
type Tab = "profile" | "account" | "security" | "settings";

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, email, image, size = 80 }: {
  name: string | null; email: string; image: string | null; size?: number;
}) {
  const initials = name ? name.slice(0, 2) : email.slice(0, 2).toUpperCase();
  if (image) {
    return (
      <img src={image} alt={name ?? email} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36,
        background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}>
      {initials}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 mb-4"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      {title && (
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#1e293b" }}>{title}</h3>
      )}
      {children}
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: "#64748b" }}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled, type = "text" }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  disabled?: boolean; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200"
      style={{ background: disabled ? "#f8fafc" : "#f8fafc", border: "1px solid #e2e8f0",
        color: disabled ? "#94a3b8" : "#1e293b", cursor: disabled ? "not-allowed" : "text" }}
      onFocus={(e) => { if (!disabled) e.target.style.borderColor = "#6366f1"; }}
      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
  );
}

// ─── ActionBar ────────────────────────────────────────────────────────────────

function ActionBar({ onSave, onCancel, saving, message, isSuccess }: {
  onSave: () => void; onCancel: () => void; saving: boolean; message: string; isSuccess: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between mt-2">
      {message ? (
        <span className="text-sm font-medium" style={{ color: isSuccess ? "#16a34a" : "#dc2626" }}>
          {isSuccess ? "✓ " : "✕ "}{message}
        </span>
      ) : <span />}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.08)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}>
          {t.cancel}
        </button>
        <button onClick={onSave} disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: saving ? "#e2e8f0" : "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            color: saving ? "#94a3b8" : "#fff",
            boxShadow: saving ? "none" : "0 4px 12px rgba(99,102,241,0.25)",
          }}>
          {saving ? t.savingBtn : t.saveBtn}
        </button>
      </div>
    </div>
  );
}

// ─── Tab 1: 프로필 ────────────────────────────────────────────────────────────

function ProfileTab({ currentUser, profile, onSaved }: {
  currentUser: CurrentUser; profile: UserProfile | null; onSaved: (p: UserProfile) => void;
}) {
  const { t } = useLanguage();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [imageUrl, setImageUrl] = useState(profile?.profileImage ?? "");
  const [resetToGoogle, setResetToGoogle] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<"idle"|"checking"|"ok"|"taken"|"error">("idle");
  const [nicknameMsg, setNicknameMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgSuccess, setSaveMsgSuccess] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkNickname = useCallback((val: string) => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    const trimmed = val.trim();
    if (!trimmed || trimmed === profile?.nickname) {
      setNicknameStatus("idle"); setNicknameMsg(""); return;
    }
    setNicknameStatus("checking");
    checkTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/profile/check-nickname?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setNicknameStatus(data.available ? "ok" : "taken");
      setNicknameMsg(data.message ?? "");
    }, 350);
  }, [profile?.nickname]);

  function handleNicknameChange(val: string) {
    setNickname(val); checkNickname(val);
  }

  const displayImage = resetToGoogle ? currentUser.image : (imageUrl || profile?.profileImage || currentUser.image);

  async function handleSave() {
    if (saving) return;
    if (nicknameStatus === "taken" || nicknameStatus === "checking") return;
    setSaving(true); setSaveMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nickname.trim() || null,
        bio: bio.trim() || null,
        profileImage: imageUrl.trim() || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
      setResetToGoogle(false);
      window.dispatchEvent(new CustomEvent("profile-image-updated", { detail: { profileImage: updated.profileImage ?? null, nickname: updated.nickname ?? null } }));
      setSaveMsg(t.savedSuccess);
      setSaveMsgSuccess(true);
    } else {
      const d = await res.json();
      setSaveMsg(d.error ?? t.savedFail);
      setSaveMsgSuccess(false);
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function handleReset() {
    setNickname(profile?.nickname ?? "");
    setBio(profile?.bio ?? "");
    setImageUrl(profile?.profileImage ?? "");
    setResetToGoogle(false);
    setNicknameStatus("idle"); setNicknameMsg("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 256;
      const scale = Math.min(size / img.width, size / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageUrl(canvas.toDataURL("image/jpeg", 0.85));
      setResetToGoogle(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  }

  const nicknameColor = nicknameStatus === "ok" ? "#22c55e"
    : nicknameStatus === "taken" || nicknameStatus === "error" ? "#ef4444"
    : "#94a3b8";

  return (
    <>
      <Card title={t.profileImageTitle}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <Avatar name={profile?.nickname ?? currentUser.name}
              email={currentUser.email} image={displayImage ?? null} size={80} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}
              title={t.uploadFile}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-0.5" style={{ color: "#1e293b" }}>
              {profile?.nickname ?? currentUser.name ?? currentUser.email.split("@")[0]}
            </p>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>{currentUser.email}</p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
                style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
              >
                📁 {t.uploadFile}
              </button>
              {(imageUrl || profile?.profileImage) && (
                <button
                  onClick={() => { setImageUrl(""); setResetToGoogle(true); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
                  style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#64748b"; }}
                >
                  {t.resetToGoogleImage}
                </button>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>{t.profileImageHint}</p>
          </div>
        </div>
      </Card>

      <Card title={t.nicknameTitle}>
        <Field label={t.nicknameFieldLabel} hint={t.nicknameHint}>
          <div className="relative">
            <Input value={nickname} onChange={handleNicknameChange} placeholder={t.nicknamePlaceholder} />
            {nicknameStatus !== "idle" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                style={{ color: nicknameColor }}>
                {nicknameStatus === "checking" ? t.nicknameChecking : nicknameStatus === "ok" ? t.nicknameAvailable : nicknameMsg}
              </span>
            )}
          </div>
        </Field>
      </Card>

      <Card title={t.bioTitle}>
        <Field label={t.bioLabel} hint={t.bioHint}>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            maxLength={200} placeholder={t.bioPlaceholder}
            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b" }}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
          <div className="flex justify-end mt-1">
            <span className="text-xs" style={{ color: "#94a3b8" }}>{bio.length}/200</span>
          </div>
        </Field>
      </Card>

      <ActionBar onSave={handleSave} onCancel={handleReset} saving={saving} message={saveMsg} isSuccess={saveMsgSuccess} />
    </>
  );
}

// ─── Tab 2: 계정 ─────────────────────────────────────────────────────────────

function AccountTab({ currentUser, profile }: { currentUser: CurrentUser; profile: UserProfile | null }) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isMobile = typeof navigator !== "undefined" && navigator.userAgent.includes("Mobile");
  const deviceLabel = isMobile ? `📱 ${t.currentDevice}` : `💻 ${t.currentDevice}`;

  async function handleDeleteAccount() {
    if (deleteInput !== t.deleteConfirmWord) return;
    setDeleting(true);
    const res = await fetch("/api/profile/account", { method: "DELETE" });
    if (res.ok) {
      await handleSignOut();
    } else {
      setDeleting(false);
      alert(t.savedFail);
    }
  }

  return (
    <>
      <Card title={t.accountInfoTitle}>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            <span className="text-sm" style={{ color: "#64748b" }}>{t.emailFieldLabel}</span>
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>{currentUser.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            <span className="text-sm" style={{ color: "#64748b" }}>{t.nicknameFieldLabel}</span>
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>
              {profile?.nickname ?? t.notSet}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "#64748b" }}>{t.joinedAt}</span>
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>
      </Card>

      <Card title={t.deviceTitle}>
        <div className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="text-xl">{isMobile ? "📱" : "💻"}</div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#1e293b" }}>{deviceLabel}</p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>{t.currentSession}</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
            {t.activeStatus}
          </span>
        </div>
        <form action={handleSignOut} className="mt-3">
          <button type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = "#6366f1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#64748b"; }}>
            {t.logoutAllDevices}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)" }}>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1" style={{ color: "#dc2626" }}>{t.deleteAccountTitle}</h4>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>{t.deleteAccountDesc}</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}>
                {t.deleteAccountBtn}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
                  {t.deleteAccountConfirmHint(t.deleteConfirmWord)}
                </p>
                <Input value={deleteInput} onChange={setDeleteInput} placeholder={t.deleteConfirmWord} />
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount}
                    disabled={deleteInput !== t.deleteConfirmWord || deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{
                      background: deleteInput === t.deleteConfirmWord ? "#dc2626" : "rgba(0,0,0,0.04)",
                      color: deleteInput === t.deleteConfirmWord ? "#fff" : "#94a3b8",
                    }}>
                    {deleting ? t.processing : t.deleteConfirmBtn}
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}>
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}

// ─── Tab 3: 보안 ─────────────────────────────────────────────────────────────

function SecurityTab({ currentUser }: { currentUser: CurrentUser }) {
  const { t } = useLanguage();
  const isGoogleUser = !!(currentUser.image && currentUser.image.includes("googleusercontent"));
  const authMethod = isGoogleUser ? "Google OAuth" : t.authEmailOtpLabel;

  return (
    <>
      <Card title={t.authMethodTitle}>
        <div className="flex items-center gap-4 p-3 rounded-xl"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}>
            <span className="text-lg">{isGoogleUser ? "🔑" : "📧"}</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>{authMethod}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {isGoogleUser ? t.authGoogleLinked : t.authOtpDesc}
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">ℹ️</span>
            <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
              {isGoogleUser ? t.authGoogleNote : t.authOtpNote}
            </p>
          </div>
        </div>
      </Card>

      <Card title={t.securityChecklistTitle}>
        <div className="space-y-3">
          {[
            { label: t.emailVerifiedLabel, done: true, desc: t.emailVerifiedDesc },
            {
              label: isGoogleUser ? t.authGoogle2FALabel : t.authOtpCheckLabel,
              done: true,
              desc: isGoogleUser ? t.authGoogle2FADesc : t.authOtpCheckDesc,
            },
            { label: t.profileRegisteredLabel, done: !!(currentUser.name), desc: t.profileRegisteredDesc },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
                style={{ background: item.done ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.05)" }}>
                <span className="text-xs">{item.done ? "✓" : "○"}</span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: item.done ? "#1e293b" : "#64748b" }}>
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ─── Tab 4: 환경설정 ──────────────────────────────────────────────────────────

function SettingsTab({ profile, onSaved }: { profile: UserProfile | null; onSaved: (p: UserProfile) => void }) {
  const { t, changeLanguage } = useLanguage();
  const [language, setLanguage] = useState<Lang>((profile?.language as Lang) ?? "ko");
  const [pendingLang, setPendingLang] = useState<Lang | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgSuccess, setSaveMsgSuccess] = useState(false);

  async function handleSave() {
    setSaving(true); setSaveMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
      setSaveMsg(t.savedSuccess);
      setSaveMsgSuccess(true);
    } else {
      setSaveMsg(t.savedFail);
      setSaveMsgSuccess(false);
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function handleSelectLang(code: Lang) {
    if (code === language) return;
    setPendingLang(code);
  }

  function confirmLang() {
    if (pendingLang) {
      setLanguage(pendingLang);
      changeLanguage(pendingLang);
      setPendingLang(null);
    }
  }

  const langs = Object.keys(LANG_NAMES) as Lang[];

  return (
    <>
      {pendingLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setPendingLang(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{LANG_FLAGS[pendingLang]}</span>
              <div>
                <h3 className="font-bold text-base" style={{ color: "#1e293b" }}>
                  {t.langChangeTo(LANG_NAMES[pendingLang])}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{t.langChangeSubtitle}</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-5">
              {[t.langApplies1, t.langApplies2, t.langApplies3, t.langApplies4].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#475569" }}>
                  <span className="mt-0.5 flex-shrink-0">{item.slice(0, 2)}</span>
                  <span>{item.slice(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => setPendingLang(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}>
                {t.cancel}
              </button>
              <button onClick={confirmLang}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                {t.langConfirmBtn(LANG_FLAGS[pendingLang])}
              </button>
            </div>
          </div>
        </div>
      )}

      <Card title={t.langSettingsTitle}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {langs.map((code) => (
            <button key={code}
              onClick={() => handleSelectLang(code)}
              className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all duration-150 text-left"
              style={{
                background: language === code ? "rgba(99,102,241,0.06)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${language === code ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.05)"}`,
              }}>
              <span className="text-lg flex-shrink-0">{LANG_FLAGS[code]}</span>
              <span className="text-sm font-medium truncate" style={{ color: language === code ? "#6366f1" : "#475569" }}>
                {LANG_NAMES[code]}
              </span>
              {language === code && (
                <span className="ml-auto text-xs font-bold flex-shrink-0" style={{ color: "#6366f1" }}>✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)" }}>
          <p className="text-xs font-semibold mb-2.5" style={{ color: "#475569" }}>{t.langGuideTitle}</p>
          <ul className="space-y-1.5">
            {[t.langGuide1, t.langGuide2, t.langGuide3, t.langGuide4].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#64748b" }}>
                <span className="flex-shrink-0">{item.slice(0, 2)}</span>
                <span className="leading-relaxed">{item.slice(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
      <ActionBar onSave={handleSave} onCancel={() => setLanguage((profile?.language as Lang) ?? "ko")}
        saving={saving} message={saveMsg} isSuccess={saveMsgSuccess} />
    </>
  );
}

// ─── ProfileClient (main) ─────────────────────────────────────────────────────

export function ProfileClient({
  currentUser,
  initialProfile,
}: {
  currentUser: CurrentUser;
  initialProfile: UserProfile | null;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "profile", label: t.tabProfile, emoji: "👤" },
    { key: "account", label: t.tabAccount, emoji: "🏠" },
    { key: "security", label: t.tabSecurity, emoji: "🔒" },
    { key: "settings", label: t.tabAppSettings, emoji: "⚙️" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1e293b" }}>{t.profilePageTitle}</h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>{t.profilePageSubtitle}</p>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-6 p-1 rounded-2xl" style={{ background: "#f1f5f9" }}>
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl py-2 px-1 text-xs sm:text-sm font-medium transition-all duration-200"
            style={tab === tb.key
              ? { background: "#fff", color: "#6366f1", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { color: "#64748b" }}>
            <span className="text-base sm:text-sm">{tb.emoji}</span>
            <span className="hidden sm:inline">{tb.label}</span>
            <span className="sm:hidden text-[10px]">{tb.label}</span>
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileTab currentUser={currentUser} profile={profile} onSaved={setProfile} />
      )}
      {tab === "account" && (
        <AccountTab currentUser={currentUser} profile={profile} />
      )}
      {tab === "security" && (
        <SecurityTab currentUser={currentUser} />
      )}
      {tab === "settings" && (
        <SettingsTab profile={profile} onSaved={setProfile} />
      )}
    </div>
  );
}
