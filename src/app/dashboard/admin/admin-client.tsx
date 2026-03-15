"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";

type Tab = "logins" | "errors" | "users";

interface LoginLog {
  id: number;
  email: string;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  provider: string | null;
  userAgent: string | null;
}

interface ErrorLog {
  id: number;
  path: string;
  method: string;
  errorMessage: string;
  stack: string | null;
  userEmail: string | null;
  statusCode: number | null;
  timestamp: string;
}

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  addedBy: string | null;
  isActive: boolean;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

function ProviderBadge({ provider }: { provider: string | null }) {
  const label = provider === "google" ? "Google" : provider === "email-otp" ? "OTP" : (provider ?? "unknown");
  const bg = provider === "google" ? "#dbeafe" : provider === "email-otp" ? "#fef3c7" : "#f1f5f9";
  const color = provider === "google" ? "#1d4ed8" : provider === "email-otp" ? "#92400e" : "#475569";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    GET: { bg: "#dcfce7", color: "#166534" },
    POST: { bg: "#dbeafe", color: "#1d4ed8" },
    PUT: { bg: "#fef3c7", color: "#92400e" },
    PATCH: { bg: "#fef3c7", color: "#92400e" },
    DELETE: { bg: "#fee2e2", color: "#991b1b" },
  };
  const style = colorMap[method.toUpperCase()] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}
    >
      {method.toUpperCase()}
    </span>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: isActive ? "#dcfce7" : "#fee2e2",
        color: isActive ? "#166534" : "#991b1b",
      }}
    >
      {isActive ? "활성" : "비활성"}
    </span>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "12px 16px" }}>
          <div
            style={{
              height: "14px",
              borderRadius: "6px",
              background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              width: i === 0 ? "60%" : i === 1 ? "80%" : "50%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function ErrorRow({ log }: { log: ErrorLog }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap", minWidth: "140px" }}>
          {formatTimestamp(log.timestamp)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <MethodBadge method={log.method} />
            <code style={{ fontSize: "0.8rem", color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "1px 6px", borderRadius: "4px" }}>
              {log.path}
            </code>
            {log.statusCode && (
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: log.statusCode >= 500 ? "#ef4444" : "#f59e0b" }}>
                {log.statusCode}
              </span>
            )}
            {log.userEmail && (
              <span style={{ fontSize: "0.75rem", color: "#475569" }}>{log.userEmail}</span>
            )}
          </div>
          <p style={{ fontSize: "0.875rem", color: "#ef4444", margin: 0, wordBreak: "break-word" }}>
            {log.errorMessage}
          </p>
          {log.stack && (
            <div style={{ marginTop: "6px" }}>
              <button
                onClick={() => setExpanded((v) => !v)}
                style={{
                  fontSize: "0.75rem",
                  color: "#6366f1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {expanded ? "스택 숨기기" : "스택 보기"}
              </button>
              {expanded && (
                <pre
                  style={{
                    marginTop: "6px",
                    fontSize: "0.7rem",
                    color: "#64748b",
                    background: "#f8fafc",
                    border: "1px solid rgba(0,0,0,0.07)",
                    borderRadius: "6px",
                    padding: "10px",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {log.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminClient() {
  const [tab, setTab] = useState<Tab>("logins");
  const [loading, setLoading] = useState(true);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [errorLogsList, setErrorLogsList] = useState<ErrorLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // useLanguage is available but we keep labels in Korean as primary
  useLanguage();

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?tab=${t}`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (t === "logins") setLoginLogs(data);
      else if (t === "errors") setErrorLogsList(data);
      else if (t === "users") setUsers(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(tab);
  }, [tab, fetchData]);

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: "1rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "logins", label: "로그인 로그" },
    { key: "errors", label: "에러 로그" },
    { key: "users", label: "사용자" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
              서버 관리자
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "4px 0 0" }}>
              로그인 기록, 에러 로그, 사용자 관리
            </p>
          </div>
          <button
            onClick={() => fetchData(tab)}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "0.75rem",
              border: "1px solid rgba(99,102,241,0.3)",
              background: loading ? "#f1f5f9" : "rgba(99,102,241,0.08)",
              color: "#6366f1",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            <svg
              style={{ width: "16px", height: "16px", animation: loading ? "spin 1s linear infinite" : "none" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#f1f5f9",
            borderRadius: "0.875rem",
            padding: "4px",
            marginBottom: "20px",
            width: "fit-content",
          }}
        >
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "8px 20px",
                borderRadius: "0.625rem",
                border: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.15s",
                background: tab === key ? "#6366f1" : "transparent",
                color: tab === key ? "#fff" : "#475569",
                boxShadow: tab === key ? "0 1px 4px rgba(99,102,241,0.25)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Logins Tab */}
        {tab === "logins" && (
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>로그인 로그</span>
              {!loading && (
                <span style={{ marginLeft: "8px", fontSize: "0.8rem", color: "#94a3b8" }}>
                  최근 {loginLogs.length}건
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["이메일", "공급자", "시각", "IP 주소", "User Agent"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#475569",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  ) : loginLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        로그인 기록이 없습니다
                      </td>
                    </tr>
                  ) : (
                    loginLogs.map((log) => (
                      <tr
                        key={log.id}
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500 }}>
                          {log.email}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <ProviderBadge provider={log.provider} />
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569", whiteSpace: "nowrap" }}>
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569", fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {log.ipAddress ?? "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "#94a3b8",
                            fontSize: "0.75rem",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={log.userAgent ?? ""}
                        >
                          {log.userAgent ?? "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {tab === "errors" && (
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>에러 로그</span>
              {!loading && (
                <span style={{ marginLeft: "8px", fontSize: "0.8rem", color: "#94a3b8" }}>
                  최근 {errorLogsList.length}건
                </span>
              )}
            </div>
            <div style={{ padding: "0 20px" }}>
              {loading ? (
                <div style={{ padding: "20px 0" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: "60px",
                        borderRadius: "8px",
                        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                        marginBottom: "12px",
                      }}
                    />
                  ))}
                </div>
              ) : errorLogsList.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                  에러 로그가 없습니다
                </div>
              ) : (
                errorLogsList.map((log) => <ErrorRow key={log.id} log={log} />)
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>사용자</span>
              {!loading && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: "rgba(99,102,241,0.1)",
                    color: "#6366f1",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  총 {users.length}명
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["이메일", "이름", "상태", "가입일", "추가자"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#475569",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        사용자가 없습니다
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500 }}>
                          {user.email}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {user.name ?? "-"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <ActiveBadge isActive={user.isActive} />
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569", whiteSpace: "nowrap" }}>
                          {formatTimestamp(user.createdAt)}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "0.8rem" }}>
                          {user.addedBy ?? "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
