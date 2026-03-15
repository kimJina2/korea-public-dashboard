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

// ─── Tab 1: 프로필 ────────────────────────────────────────────────────────────

function ProfileTab({ currentUser, profile, onSaved }: {
  currentUser: CurrentUser; profile: UserProfile | null; onSaved: (p: UserProfile) => void;
}) {
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [imageUrl, setImageUrl] = useState(profile?.profileImage ?? "");
  const [resetToGoogle, setResetToGoogle] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<"idle"|"checking"|"ok"|"taken"|"error">("idle");
  const [nicknameMsg, setNicknameMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
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
      setSaveMsg("저장되었습니다.");
    } else {
      const d = await res.json();
      setSaveMsg(d.error ?? "저장에 실패했습니다.");
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
      {/* 프로필 이미지 */}
      <Card title="프로필 이미지">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <Avatar name={profile?.nickname ?? currentUser.name}
              email={currentUser.email} image={displayImage ?? null} size={80} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}
              title="이미지 변경"
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
                📁 파일 업로드
              </button>
              {(imageUrl || profile?.profileImage) && (
                <button
                  onClick={() => { setImageUrl(""); setResetToGoogle(true); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
                  style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#64748b"; }}
                >
                  Google 이미지로 초기화
                </button>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
              기본값은 Google 프로필 이미지입니다. 파일을 업로드하면 변경됩니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 닉네임 */}
      <Card title="닉네임">
        <Field label="닉네임" hint="2~20자, 한글·영문·숫자·_·- 사용 가능">
          <div className="relative">
            <Input value={nickname} onChange={handleNicknameChange} placeholder="닉네임을 입력하세요" />
            {nicknameStatus !== "idle" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                style={{ color: nicknameColor }}>
                {nicknameStatus === "checking" ? "확인 중..." : nicknameStatus === "ok" ? "✓ 사용 가능" : nicknameMsg}
              </span>
            )}
          </div>
        </Field>
      </Card>

      {/* 자기소개 */}
      <Card title="자기소개">
        <Field label="소개" hint="최대 200자">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            maxLength={200} placeholder="자신을 소개해주세요..."
            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b" }}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }} />
          <div className="flex justify-end mt-1">
            <span className="text-xs" style={{ color: "#94a3b8" }}>{bio.length}/200</span>
          </div>
        </Field>
      </Card>

      {/* 저장/취소 */}
      <ActionBar onSave={handleSave} onCancel={handleReset} saving={saving} message={saveMsg} />
    </>
  );
}

// ─── Tab 2: 계정 ─────────────────────────────────────────────────────────────

function AccountTab({ currentUser, profile }: { currentUser: CurrentUser; profile: UserProfile | null }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const deviceInfo = typeof navigator !== "undefined"
    ? navigator.userAgent.includes("Mobile") ? "📱 모바일 브라우저" : "💻 데스크탑 브라우저"
    : "브라우저";

  async function handleDeleteAccount() {
    if (deleteInput !== "탈퇴") return;
    setDeleting(true);
    const res = await fetch("/api/profile/account", { method: "DELETE" });
    if (res.ok) {
      await handleSignOut();
    } else {
      setDeleting(false);
      alert("계정 탈퇴에 실패했습니다.");
    }
  }

  return (
    <>
      {/* 계정 정보 */}
      <Card title="계정 정보">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            <span className="text-sm" style={{ color: "#64748b" }}>이메일</span>
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>{currentUser.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            <span className="text-sm" style={{ color: "#64748b" }}>닉네임</span>
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>
              {profile?.nickname ?? "미설정"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "#64748b" }}>가입일</span>
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("ko-KR")
                : "-"}
            </span>
          </div>
        </div>
      </Card>

      {/* 로그인 기기 관리 */}
      <Card title="로그인 기기 관리">
        <div className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="text-xl">{deviceInfo.split(" ")[0]}</div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#1e293b" }}>
                현재 기기 {deviceInfo.split(" ").slice(1).join(" ")}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>현재 세션</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
            활성
          </span>
        </div>
        <form action={handleSignOut} className="mt-3">
          <button type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = "#6366f1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#64748b"; }}>
            모든 기기에서 로그아웃
          </button>
        </form>
      </Card>

      {/* 계정 탈퇴 */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)" }}>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1" style={{ color: "#dc2626" }}>계정 탈퇴</h4>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
              탈퇴 시 계정이 비활성화되며 복구할 수 없습니다.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}>
                계정 탈퇴
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
                  확인을 위해 <strong>탈퇴</strong>를 입력해주세요.
                </p>
                <Input value={deleteInput} onChange={setDeleteInput} placeholder="탈퇴" />
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount}
                    disabled={deleteInput !== "탈퇴" || deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{
                      background: deleteInput === "탈퇴" ? "#dc2626" : "rgba(0,0,0,0.04)",
                      color: deleteInput === "탈퇴" ? "#fff" : "#94a3b8",
                    }}>
                    {deleting ? "처리 중..." : "탈퇴 확인"}
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}>
                    취소
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
  const isGoogleUser = !!(currentUser.image && currentUser.image.includes("googleusercontent"));
  const authMethod = isGoogleUser ? "Google OAuth" : "이메일 OTP";

  return (
    <>
      <Card title="인증 방식">
        <div className="flex items-center gap-4 p-3 rounded-xl"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}>
            <span className="text-lg">{isGoogleUser ? "🔑" : "📧"}</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>{authMethod}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {isGoogleUser
                ? "Google 계정과 연동되어 있습니다."
                : "이메일 OTP로 인증합니다."}
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">ℹ️</span>
            <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
              {isGoogleUser
                ? "비밀번호 및 이메일 변경은 Google 계정 설정에서 관리됩니다. Google 계정 보안을 강화하려면 Google 계정의 2단계 인증을 활성화하세요."
                : "이메일 OTP 방식은 로그인 시마다 인증 코드를 발송합니다. 이메일 계정의 보안이 곧 이 서비스의 보안입니다."}
            </p>
          </div>
        </div>
      </Card>

      <Card title="보안 체크리스트">
        <div className="space-y-3">
          {[
            { label: "이메일 인증 완료", done: true, desc: "로그인 이메일이 확인되었습니다." },
            { label: isGoogleUser ? "Google 2단계 인증" : "OTP 인증", done: true, desc: isGoogleUser ? "Google 계정에서 설정하세요." : "로그인 시 OTP 인증을 사용합니다." },
            { label: "프로필 정보 등록", done: !!(currentUser.name), desc: "닉네임과 프로필 이미지를 설정하면 보안 복구에 도움이 됩니다." },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full mt-0.5`}
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
  const { changeLanguage } = useLanguage();
  const [language, setLanguage] = useState<Lang>((profile?.language as Lang) ?? "ko");
  const [pendingLang, setPendingLang] = useState<Lang | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  async function handleSave() {
    setSaving(true); setSaveMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
    if (res.ok) { const updated = await res.json(); onSaved(updated); setSaveMsg("저장되었습니다."); }
    else setSaveMsg("저장에 실패했습니다.");
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
      {/* 언어 변경 확인 다이얼로그 */}
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
                  {LANG_NAMES[pendingLang]}으로 변경
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  언어를 변경하면 다음 UI가 즉시 바뀝니다
                </p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-5">
              {[
                "🧭 상단 네비게이션 메뉴 (대시보드, 대기질, 날씨, 교통, 게시판)",
                "📋 게시판 전체 UI (목록, 상세, 작성, 댓글, 관리자 기능)",
                "👤 프로필 버튼 드롭다운 (설정, 로그아웃)",
                "🌐 언어 선택기 레이블",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#475569" }}>
                  <span className="mt-0.5 flex-shrink-0">{item.slice(0, 2)}</span>
                  <span>{item.slice(2)}</span>
                </li>
              ))}
            </ul>
            <div className="p-3 rounded-xl mb-5"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                ⚠️ 프로필 설정 페이지 자체는 현재 다국어 미지원입니다. 저장 후 적용됩니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPendingLang(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}>
                취소
              </button>
              <button onClick={confirmLang}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                {LANG_FLAGS[pendingLang]} 변경 확인
              </button>
            </div>
          </div>
        </div>
      )}

      <Card title="언어 설정">
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

        {/* 안내 불렛 */}
        <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)" }}>
          <p className="text-xs font-semibold mb-2.5" style={{ color: "#475569" }}>📌 언어 설정 안내</p>
          <ul className="space-y-1.5">
            {[
              { icon: "✅", text: "적용 범위: 네비게이션, 게시판 전체 UI, 프로필 버튼 메뉴" },
              { icon: "✅", text: "설정은 브라우저(localStorage) + 서버에 저장되어 다음 방문 시에도 유지됩니다" },
              { icon: "✅", text: "저장 버튼을 눌러야 최종 적용됩니다" },
              { icon: "⚠️", text: "프로필 설정 페이지 자체는 현재 다국어가 적용되지 않습니다" },
              { icon: "⚠️", text: "언어 변경 후 페이지를 새로고침하면 즉시 전체 반영됩니다" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-2 text-xs" style={{ color: "#64748b" }}>
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
      <ActionBar onSave={handleSave} onCancel={() => setLanguage((profile?.language as Lang) ?? "ko")}
        saving={saving} message={saveMsg} />
    </>
  );
}

// ─── ActionBar ────────────────────────────────────────────────────────────────

function ActionBar({ onSave, onCancel, saving, message }: {
  onSave: () => void; onCancel: () => void; saving: boolean; message: string;
}) {
  const isSuccess = message === "저장되었습니다.";
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
          취소
        </button>
        <button onClick={onSave} disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: saving ? "#e2e8f0" : "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            color: saving ? "#94a3b8" : "#fff",
            boxShadow: saving ? "none" : "0 4px 12px rgba(99,102,241,0.25)",
          }}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
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
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "profile", label: "프로필", emoji: "👤" },
    { key: "account", label: "계정", emoji: "🏠" },
    { key: "security", label: "보안", emoji: "🔒" },
    { key: "settings", label: "환경설정", emoji: "⚙️" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1e293b" }}>프로필 설정</h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          계정 정보와 환경 설정을 관리하세요
        </p>
      </div>

      {/* 탭 */}
      <div className="grid grid-cols-4 gap-1 mb-6 p-1 rounded-2xl" style={{ background: "#f1f5f9" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl py-2 px-1 text-xs sm:text-sm font-medium transition-all duration-200"
            style={tab === t.key
              ? { background: "#fff", color: "#6366f1", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { color: "#64748b" }}>
            <span className="text-base sm:text-sm">{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden text-[10px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
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
