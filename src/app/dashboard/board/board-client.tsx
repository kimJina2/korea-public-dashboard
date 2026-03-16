"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { timeAgoI18n } from "@/lib/i18n";

// ─── Heart animation keyframes ────────────────────────────────────────────────

const HEART_STYLE = `
@keyframes heartFloat {
  0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
  25%  { transform: translate(calc(-50% + var(--dx) * 0.3), -35px) scale(1.3); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), -140px) scale(0.15); opacity: 0; }
}
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type HeartParticle = { id: number; x: number; y: number; size: number; dx: number; delay: number; emoji: string; duration: number };
type CurrentUser = { email: string; name: string | null; image: string | null };

type Post = {
  id: number;
  authorEmail: string;
  authorName: string | null;
  authorImage: string | null;
  title: string | null;
  content: string;
  boardType: string;
  visibility: string;
  answerStatus: string;
  processStatus: string;
  hasAdminReply: boolean;
  createdAt: string;
  updatedAt: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isOwner: boolean;
};

type CommentNode = {
  id: number;
  postId: number;
  parentId: number | null;
  authorEmail: string;
  authorName: string | null;
  authorImage: string | null;
  content: string;
  isAdminFeedback: boolean;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  myReaction: "like" | "dislike" | null;
  replies: CommentNode[];
};

type BoardReply = {
  id: number;
  postId: number;
  adminEmail: string;
  adminName: string | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BOARD_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: "rgba(99,102,241,0.1)", text: "#6366f1" },
  inquiry: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  report: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
};

const ANSWER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.1)", text: "#d97706" },
  answered: { bg: "rgba(16,185,129,0.1)", text: "#059669" },
};


// ─── Utilities ────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, email, image, size = 40 }: { name: string | null; email: string; image: string | null; size?: number }) {
  const [imgError, setImgError] = React.useState(false);
  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name ?? email}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
    >
      {getInitials(name, email)}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  );
}

// ─── CommentItem ─────────────────────────────────────────────────────────────

function CommentItem({
  comment, currentUser, isAdmin, depth, onDelete, onReply, onReactionChange,
}: {
  comment: CommentNode; currentUser: CurrentUser; isAdmin: boolean; depth: number;
  onDelete: (id: number) => void; onReply: (parentId: number, authorName: string | null) => void;
  onReactionChange: (id: number, likeCount: number, dislikeCount: number, myReaction: "like" | "dislike" | null) => void;
}) {
  const { t } = useLanguage();
  const canDelete = comment.authorEmail === currentUser.email || isAdmin;

  async function handleReact(type: "like" | "dislike") {
    const res = await fetch(`/api/board/comments/${comment.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const { likeCount, dislikeCount, myReaction } = await res.json();
      onReactionChange(comment.id, likeCount, dislikeCount, myReaction);
    }
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 36 : 0 }}>
      <div className={depth > 0 ? "relative" : ""}>
        {depth > 0 && (
          <div className="absolute w-px top-0 bottom-0" style={{ background: "rgba(99,102,241,0.15)", left: -18 }} />
        )}
        <div
          className="rounded-xl p-3 mb-2"
          style={{
            background: comment.isAdminFeedback
              ? "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(251,191,36,0.08) 100%)"
              : depth > 0 ? "rgba(248,250,252,0.8)" : "transparent",
            border: comment.isAdminFeedback ? "1px solid rgba(245,158,11,0.2)" : "none",
          }}
        >
          <div className="flex items-start gap-2.5">
            <Avatar name={comment.authorName} email={comment.authorEmail} image={comment.authorImage} size={30} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                  {comment.authorName ?? comment.authorEmail.split("@")[0]}
                </span>
                {comment.isAdminFeedback && (
                  <Badge label={t.adminFeedbackBadge} bg="rgba(245,158,11,0.15)" text="#d97706" />
                )}
                <span className="text-xs" style={{ color: "#94a3b8" }}>{timeAgoI18n(comment.createdAt, t)}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{comment.content}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={() => handleReact("like")}
                  className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
                  style={{ color: comment.myReaction === "like" ? "#6366f1" : "#94a3b8" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#6366f1")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = comment.myReaction === "like" ? "#6366f1" : "#94a3b8")}
                >
                  👍 {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                </button>
                <button
                  onClick={() => handleReact("dislike")}
                  className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
                  style={{ color: comment.myReaction === "dislike" ? "#ef4444" : "#94a3b8" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ef4444")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = comment.myReaction === "dislike" ? "#ef4444" : "#94a3b8")}
                >
                  👎 {comment.dislikeCount > 0 && <span>{comment.dislikeCount}</span>}
                </button>
                {depth === 0 && (
                  <button
                    onClick={() => onReply(comment.id, comment.authorName)}
                    className="text-xs font-medium transition-colors duration-150"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#6366f1")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
                  >{t.replyBtn}</button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { if (window.confirm(t.deleteComment)) onDelete(comment.id); }}
                    className="text-xs font-medium transition-colors duration-150"
                    style={{ color: "#cbd5e1" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ef4444")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#cbd5e1")}
                  >{t.delete}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {comment.replies.map((r) => (
        <CommentItem key={r.id} comment={r} currentUser={currentUser} isAdmin={isAdmin} depth={depth + 1} onDelete={onDelete} onReply={onReply} onReactionChange={onReactionChange} />
      ))}
    </div>
  );
}

// ─── CommentSection ──────────────────────────────────────────────────────────

function CommentSection({ postId, currentUser, isAdmin, onCountChange }: {
  postId: number; currentUser: CurrentUser; isAdmin: boolean; onCountChange?: (delta: number) => void;
}) {
  const { t } = useLanguage();
  const [commentList, setCommentList] = useState<CommentNode[]>([]);

  function updateReaction(id: number, likeCount: number, dislikeCount: number, myReaction: "like" | "dislike" | null) {
    function applyToNodes(nodes: CommentNode[]): CommentNode[] {
      return nodes.map((n) =>
        n.id === id
          ? { ...n, likeCount, dislikeCount, myReaction }
          : { ...n, replies: applyToNodes(n.replies) }
      );
    }
    setCommentList((prev) => applyToNodes(prev));
  }
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; name: string | null } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function countAll(nodes: CommentNode[]): number {
    return nodes.reduce((acc, n) => acc + 1 + countAll(n.replies), 0);
  }

  useEffect(() => {
    fetch(`/api/board/posts/${postId}/comments`)
      .then((r) => r.json())
      .then(setCommentList)
      .finally(() => setLoading(false));
  }, [postId]);

  async function submit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/board/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, parentId: replyTo?.id ?? null }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/board/posts/${postId}/comments`).then((r) => r.json());
      const delta = countAll(updated) - countAll(commentList);
      setCommentList(updated);
      setText("");
      setReplyTo(null);
      onCountChange?.(delta);
    }
    setSubmitting(false);
  }

  async function deleteComment(id: number) {
    const res = await fetch(`/api/board/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      const updated = await fetch(`/api/board/posts/${postId}/comments`).then((r) => r.json());
      onCountChange?.(countAll(updated) - countAll(commentList));
      setCommentList(updated);
    }
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      {loading ? (
        <p className="py-4 text-center text-sm" style={{ color: "#94a3b8" }}>{t.loadingComments}</p>
      ) : commentList.length === 0 ? (
        <p className="py-3 text-sm text-center" style={{ color: "#cbd5e1" }}>{t.firstComment}</p>
      ) : (
        <div className="mb-3 space-y-1">
          {commentList.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUser={currentUser}
              isAdmin={isAdmin}
              depth={0}
              onDelete={deleteComment}
              onReply={(id, name) => { setReplyTo({ id, name }); setTimeout(() => inputRef.current?.focus(), 50); }}
              onReactionChange={updateReaction}
            />
          ))}
        </div>
      )}
      <div className="flex gap-2.5 items-start mt-2 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
        <Avatar name={currentUser.name} email={currentUser.email} image={currentUser.image} size={32} />
        <div className="flex-1">
          {replyTo && (
            <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(99,102,241,0.06)", color: "#6366f1" }}>
              <span>↩ {t.replyTo(replyTo.name ?? "?")}</span>
              <button onClick={() => setReplyTo(null)} className="ml-auto font-bold" style={{ color: "#94a3b8" }}>✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={isAdmin ? t.adminFeedbackPlaceholder : replyTo ? t.replyTo(replyTo.name ?? "?") : t.commentPlaceholder}
              rows={1}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b", minHeight: 38 }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 flex-shrink-0"
              style={{
                background: text.trim() && !submitting ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" : "#e2e8f0",
                color: text.trim() && !submitting ? "#fff" : "#94a3b8",
              }}
            >
              {submitting ? "..." : t.register}
            </button>
          </div>
          {isAdmin && <p className="mt-1 text-xs" style={{ color: "#d97706" }}>{t.writingAsAdmin}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── AdminReplySection ───────────────────────────────────────────────────────

function AdminReplySection({ postId, isAdmin }: { postId: number; isAdmin: boolean }) {
  const { t } = useLanguage();
  const [replies, setReplies] = useState<BoardReply[]>([]);
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/board/posts/${postId}/replies`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReplies(data); })
      .finally(() => setLoaded(true));
  }, [postId]);

  async function submit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/board/posts/${postId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim(), isInternal }),
    });
    if (res.ok) {
      const reply = await res.json();
      setReplies((prev) => [...prev, reply]);
      setText("");
    }
    setSubmitting(false);
  }

  async function deleteReply(id: number) {
    if (!window.confirm(t.deleteReply)) return;
    const res = await fetch(`/api/board/replies/${id}`, { method: "DELETE" });
    if (res.ok) setReplies((prev) => prev.filter((r) => r.id !== id));
  }

  if (!loaded) return null;
  if (!isAdmin && replies.length === 0) return null;

  return (
    <div
      className="mt-4 rounded-2xl p-4"
      style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(251,191,36,0.06) 100%)", border: "1px solid rgba(245,158,11,0.15)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold" style={{ color: "#d97706" }}>{t.adminReplyTitle}</span>
        {isAdmin && <span className="text-xs" style={{ color: "#94a3b8" }}>({replies.length})</span>}
      </div>

      {replies.length === 0 && !isAdmin ? null : replies.length === 0 ? (
        <p className="text-sm mb-3" style={{ color: "#94a3b8" }}>{t.noAnswerYet}</p>
      ) : (
        <div className="space-y-3 mb-3">
          {replies.map((r) => (
            <div
              key={r.id}
              className="rounded-xl p-3"
              style={{
                background: r.isInternal ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.8)",
                border: r.isInternal ? "1px dashed rgba(99,102,241,0.3)" : "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {r.isInternal && (
                    <span className="text-xs font-medium mr-2" style={{ color: "#6366f1" }}>{t.internalNote}</span>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{r.content}</p>
                  <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>
                    {r.adminName ?? r.adminEmail.split("@")[0]} · {timeAgoI18n(r.createdAt, t)}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteReply(r.id)}
                    className="text-xs rounded-lg p-1 transition-all"
                    style={{ color: "#cbd5e1" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#cbd5e1"; }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.answerPlaceholder}
            rows={2}
            className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 mb-2"
            style={{ background: "#fff", border: "1px solid rgba(245,158,11,0.3)", color: "#1e293b" }}
            onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(245,158,11,0.3)")}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "#6366f1" }}>
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              {t.internalNoteLabel}
            </label>
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200"
              style={{
                background: text.trim() && !submitting ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#e2e8f0",
                color: text.trim() && !submitting ? "#fff" : "#94a3b8",
              }}
            >
              {submitting ? t.submitting : t.addReply}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AdminStatusPanel ─────────────────────────────────────────────────────────

function AdminStatusPanel({ post, onUpdated }: { post: Post; onUpdated: (updates: Partial<Post>) => void }) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState<string | null>(null);

  async function patch(field: string, value: string) {
    setSaving(field);
    const res = await fetch(`/api/board/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) onUpdated({ [field]: value } as Partial<Post>);
    setSaving(null);
  }

  const selectStyle = {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#374151",
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div
      className="mt-4 rounded-2xl p-3"
      style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: "#6366f1" }}>{t.adminStatusPanel}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#64748b" }}>{t.processStatusLabel}</span>
          <select
            value={post.processStatus}
            onChange={(e) => patch("processStatus", e.target.value)}
            disabled={saving === "processStatus"}
            style={selectStyle}
          >
            <option value="received">{t.statusReceived}</option>
            <option value="in_review">{t.statusInReview}</option>
            <option value="resolved">{t.statusResolved}</option>
            <option value="closed">{t.statusClosed}</option>
          </select>
        </div>
        {post.boardType !== "normal" && (
          <div className="flex items-center gap-1.5">
            <span style={{ color: "#64748b" }}>{t.answerStatusLabel}</span>
            <select
              value={post.answerStatus}
              onChange={(e) => patch("answerStatus", e.target.value)}
              disabled={saving === "answerStatus"}
              style={selectStyle}
            >
              <option value="pending">{t.answerPending}</option>
              <option value="answered">{t.answerComplete}</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#64748b" }}>{t.visibilityLabel}</span>
          <select
            value={post.visibility}
            onChange={(e) => patch("visibility", e.target.value)}
            disabled={saving === "visibility"}
            style={selectStyle}
          >
            <option value="public">{t.visPublic}</option>
            <option value="private">{t.visPrivate}</option>
            <option value="admin_only">{t.visAdminOnly}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── PostListItem ─────────────────────────────────────────────────────────────

function PostListItem({
  post, isAdmin, onSelect, onDelete, onLike,
}: {
  post: Post; isAdmin: boolean;
  onSelect: (id: number) => void; onDelete: (id: number) => void; onLike: (id: number) => void;
}) {
  const { t } = useLanguage();
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const HEART_EMOJIS = ["❤️", "🩷", "💕", "💖", "💗", "💓"];
  const typeColor = BOARD_TYPE_COLORS[post.boardType] ?? BOARD_TYPE_COLORS.normal;
  const canDelete = post.isOwner || isAdmin;
  const boardTypeLabel: Record<string, string> = { normal: t.normal, inquiry: t.inquiry, report: t.report };
  const answerStatusLabel: Record<string, string> = { pending: t.answerPending, answered: t.answerComplete };

  function spawnHearts(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const newHearts: HeartParticle[] = Array.from({ length: 9 + Math.floor(Math.random() * 4) }, (_, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() - 0.5) * rect.width,
      y: cy,
      size: 14 + Math.random() * 18,
      dx: (Math.random() - 0.5) * 100,
      delay: Math.random() * 250,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      duration: 900 + Math.random() * 500,
    }));
    setHearts((prev) => [...prev, ...newHearts]);
  }

  return (
    <>
      <style>{HEART_STYLE}</style>
      {hearts.map((h) => (
        <div
          key={h.id}
          onAnimationEnd={() => setHearts((prev) => prev.filter((x) => x.id !== h.id))}
          style={{
            position: "fixed", left: h.x, top: h.y, fontSize: h.size,
            pointerEvents: "none", zIndex: 9999,
            animation: `heartFloat ${h.duration}ms ease-out forwards`,
            animationDelay: `${h.delay}ms`, opacity: 0,
            ["--dx" as string]: `${h.dx}px`,
          }}
        >{h.emoji}</div>
      ))}

      <div
        className="rounded-2xl transition-all duration-200"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar name={post.authorName} email={post.authorEmail} image={post.authorImage} size={42} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: "#1e293b" }}>
                      {post.authorName ?? post.authorEmail.split("@")[0]}
                    </p>
                    <Badge label={boardTypeLabel[post.boardType] ?? t.normal} bg={typeColor.bg} text={typeColor.text} />
                    {post.visibility !== "public" && (
                      <Badge
                        label={post.visibility === "private" ? t.privatePostBadge : t.adminOnlyBadge}
                        bg="rgba(100,116,139,0.1)"
                        text="#64748b"
                      />
                    )}
                    {post.boardType !== "normal" && post.answerStatus !== "none" && answerStatusLabel[post.answerStatus] && (
                      <Badge
                        label={answerStatusLabel[post.answerStatus]}
                        bg={ANSWER_STATUS_COLORS[post.answerStatus]?.bg ?? "rgba(0,0,0,0.06)"}
                        text={ANSWER_STATUS_COLORS[post.answerStatus]?.text ?? "#64748b"}
                      />
                    )}
                    {post.hasAdminReply && post.boardType === "normal" && (
                      <Badge label={t.hasAdminReplyBadge} bg="rgba(245,158,11,0.1)" text="#d97706" />
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>{timeAgoI18n(post.createdAt, t)}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm(t.deletePost)) onDelete(post.id); }}
                    className="rounded-lg p-1.5 transition-all duration-150 flex-shrink-0"
                    style={{ color: "#cbd5e1" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#cbd5e1"; }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Title + Content preview */}
          <button
            className="w-full text-left mb-4 group"
            onClick={() => onSelect(post.id)}
          >
            {post.title && (
              <p
                className="font-semibold text-sm mb-1 group-hover:underline"
                style={{ color: "#1e293b", textDecorationColor: "#6366f1" }}
              >
                {post.title}
              </p>
            )}
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-3"
              style={{ color: "#334155" }}
            >
              {post.content}
            </p>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { if (!post.isLiked) spawnHearts(e); onLike(post.id); }}
              className="flex items-center gap-1.5 text-sm font-medium rounded-xl px-3 py-1.5 transition-all duration-200"
              style={{ background: post.isLiked ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.04)", color: post.isLiked ? "#ef4444" : "#94a3b8" }}
              onMouseEnter={(e) => { if (!post.isLiked) { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; } }}
              onMouseLeave={(e) => { if (!post.isLiked) { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#94a3b8"; } }}
            >
              <span>{post.isLiked ? "❤️" : "🤍"}</span>
              <span>{post.likeCount}</span>
            </button>

            <button
              onClick={() => onSelect(post.id)}
              className="flex items-center gap-1.5 text-sm font-medium rounded-xl px-3 py-1.5 transition-all duration-200"
              style={{ background: "rgba(0,0,0,0.04)", color: "#94a3b8" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = "#6366f1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <span>💬</span>
              <span>{t.commentCount(post.commentCount)}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PostRowItem (list view) ──────────────────────────────────────────────────

function PostRowItem({
  post, isAdmin, onSelect, onDelete, onLike,
}: {
  post: Post; isAdmin: boolean;
  onSelect: (id: number) => void; onDelete: (id: number) => void; onLike: (id: number) => void;
}) {
  const { t } = useLanguage();
  const typeColor = BOARD_TYPE_COLORS[post.boardType] ?? BOARD_TYPE_COLORS.normal;
  const canDelete = post.isOwner || isAdmin;
  const boardTypeLabel: Record<string, string> = { normal: t.normal, inquiry: t.inquiry, report: t.report };
  const answerStatusLabel: Record<string, string> = { pending: t.answerPending, answered: t.answerComplete };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", cursor: "pointer" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.03)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
      onClick={() => onSelect(post.id)}
    >
      <Avatar name={post.authorName} email={post.authorEmail} image={post.authorImage} size={30} />

      {/* Author + badges */}
      <div className="w-32 flex-shrink-0">
        <p className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>
          {post.authorName ?? post.authorEmail.split("@")[0]}
        </p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <Badge label={boardTypeLabel[post.boardType] ?? t.normal} bg={typeColor.bg} text={typeColor.text} />
          {post.boardType !== "normal" && post.answerStatus !== "none" && answerStatusLabel[post.answerStatus] && (
            <Badge
              label={answerStatusLabel[post.answerStatus]}
              bg={ANSWER_STATUS_COLORS[post.answerStatus]?.bg ?? "rgba(0,0,0,0.06)"}
              text={ANSWER_STATUS_COLORS[post.answerStatus]?.text ?? "#64748b"}
            />
          )}
        </div>
      </div>

      {/* Title / content preview */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: "#334155" }}>
          {post.title && (
            <span className="font-medium mr-1" style={{ color: "#1e293b" }}>{post.title}</span>
          )}
          {post.title && <span style={{ color: "#cbd5e1" }}>· </span>}
          <span style={{ color: "#64748b" }}>{post.content}</span>
        </p>
      </div>

      {/* Meta + actions */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ color: "#94a3b8" }}>
        <span className="text-xs">{timeAgoI18n(post.createdAt, t)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
          className="flex items-center gap-1 text-xs transition-colors duration-150"
          style={{ color: post.isLiked ? "#ef4444" : "#94a3b8" }}
          onMouseEnter={(e) => { if (!post.isLiked) (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { if (!post.isLiked) (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
        >
          <span>{post.isLiked ? "❤️" : "🤍"}</span>
          <span>{post.likeCount}</span>
        </button>
        <span className="text-xs flex items-center gap-0.5">
          <span>💬</span>
          <span>{post.commentCount}</span>
        </span>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); if (window.confirm(t.deletePost)) onDelete(post.id); }}
            className="opacity-0 group-hover:opacity-100 rounded-lg p-1 transition-all duration-150"
            style={{ color: "#cbd5e1" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#cbd5e1"; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────

function DetailView({
  postId, currentUser, isAdmin, onBack, onDelete, onLikeChange,
}: {
  postId: number; currentUser: CurrentUser; isAdmin: boolean;
  onBack: () => void; onDelete: (id: number) => void; onLikeChange: (id: number, liked: boolean, count: number) => void;
}) {
  const { t } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const HEART_EMOJIS = ["❤️", "🩷", "💕", "💖", "💗", "💓"];

  useEffect(() => {
    fetch("/api/board/posts")
      .then((r) => r.json())
      .then((data: Post[]) => {
        const found = Array.isArray(data) ? data.find((p) => p.id === postId) : null;
        if (found) { setPost(found); }
      })
      .finally(() => setLoading(false));
  }, [postId]);

  function spawnHearts(e: React.MouseEvent) {
    if (!post) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const newHearts: HeartParticle[] = Array.from({ length: 9 + Math.floor(Math.random() * 4) }, (_, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() - 0.5) * 50,
      y: cy,
      size: 14 + Math.random() * 18,
      dx: (Math.random() - 0.5) * 100,
      delay: Math.random() * 250,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      duration: 900 + Math.random() * 500,
    }));
    setHearts((prev) => [...prev, ...newHearts]);
  }

  async function handleLike(e: React.MouseEvent) {
    if (!post) return;
    if (!post.isLiked) spawnHearts(e);
    const res = await fetch(`/api/board/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked, likeCount } = await res.json();
      setPost((p) => p ? { ...p, isLiked: liked, likeCount } : p);
      onLikeChange(post.id, liked, likeCount);
    }
  }

  if (loading) return (
    <div className="py-12 text-center" style={{ color: "#94a3b8" }}>{t.loadingPosts}</div>
  );

  if (!post) return (
    <div className="py-12 text-center">
      <p style={{ color: "#ef4444" }}>{t.postNotFound}</p>
      <button onClick={onBack} className="mt-3 text-sm" style={{ color: "#6366f1" }}>← {t.backToList}</button>
    </div>
  );

  const typeColor = BOARD_TYPE_COLORS[post.boardType] ?? BOARD_TYPE_COLORS.normal;

  return (
    <>
      <style>{HEART_STYLE}</style>
      {hearts.map((h) => (
        <div
          key={h.id}
          onAnimationEnd={() => setHearts((prev) => prev.filter((x) => x.id !== h.id))}
          style={{
            position: "fixed", left: h.x, top: h.y, fontSize: h.size,
            pointerEvents: "none", zIndex: 9999,
            animation: `heartFloat ${h.duration}ms ease-out forwards`,
            animationDelay: `${h.delay}ms`, opacity: 0,
            ["--dx" as string]: `${h.dx}px`,
          }}
        >{h.emoji}</div>
      ))}

      <div className="rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="p-5">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge label={({ normal: t.normal, inquiry: t.inquiry, report: t.report } as Record<string, string>)[post.boardType] ?? t.normal} bg={typeColor.bg} text={typeColor.text} />
            {post.visibility !== "public" && (
              <Badge label={post.visibility === "private" ? t.privatePostBadge : t.adminOnlyBadge} bg="rgba(100,116,139,0.1)" text="#64748b" />
            )}
            {post.boardType !== "normal" && post.answerStatus !== "none" && ({ pending: t.answerPending, answered: t.answerComplete } as Record<string, string>)[post.answerStatus] && (
              <Badge
                label={({ pending: t.answerPending, answered: t.answerComplete } as Record<string, string>)[post.answerStatus]}
                bg={ANSWER_STATUS_COLORS[post.answerStatus]?.bg ?? "rgba(0,0,0,0.06)"}
                text={ANSWER_STATUS_COLORS[post.answerStatus]?.text ?? "#64748b"}
              />
            )}
            {isAdmin && post.boardType !== "normal" && (
              <Badge
                label={({ received: t.statusReceived, in_review: t.statusInReview, resolved: t.statusResolved, closed: t.statusClosed } as Record<string, string>)[post.processStatus] ?? post.processStatus}
                bg="rgba(99,102,241,0.08)"
                text="#6366f1"
              />
            )}
          </div>

          {/* Author */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar name={post.authorName} email={post.authorEmail} image={post.authorImage} size={44} />
            <div>
              <p className="font-semibold" style={{ color: "#1e293b" }}>
                {post.authorName ?? post.authorEmail.split("@")[0]}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>{timeAgoI18n(post.createdAt, t)}</p>
            </div>
            {(post.isOwner || isAdmin) && (
              <button
                className="ml-auto rounded-lg p-1.5 transition-all"
                style={{ color: "#cbd5e1" }}
                onClick={() => { if (window.confirm(t.deletePost)) { onDelete(post.id); onBack(); } }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#cbd5e1"; }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {post.title && (
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1e293b" }}>{post.title}</h2>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-5" style={{ color: "#334155" }}>
            {post.content}
          </p>

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm font-medium rounded-xl px-4 py-2 transition-all duration-200"
            style={{ background: post.isLiked ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.04)", color: post.isLiked ? "#ef4444" : "#94a3b8" }}
            onMouseEnter={(e) => { if (!post.isLiked) { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; } }}
            onMouseLeave={(e) => { if (!post.isLiked) { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#94a3b8"; } }}
          >
            <span>{post.isLiked ? "❤️" : "🤍"}</span>
            <span>{t.likeCount(post.likeCount)}</span>
          </button>

          {/* Admin status panel */}
          {isAdmin && (
            <AdminStatusPanel
              post={post}
              onUpdated={(updates) => setPost((p) => p ? { ...p, ...updates } : p)}
            />
          )}

          {/* Admin reply section */}
          {(post.hasAdminReply || isAdmin) && (
            <AdminReplySection postId={post.id} isAdmin={isAdmin} />
          )}

          {/* Comments */}
          <CommentSection
            postId={post.id}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onCountChange={() => {}}
          />
        </div>
      </div>

      {/* Back button (bottom) */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onBack}
          className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity duration-150"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          {t.backToList}
        </button>
      </div>
    </>
  );
}

// ─── WriteForm ────────────────────────────────────────────────────────────────

function WriteForm({
  currentUser, onCreated, onCancel,
}: {
  currentUser: CurrentUser; onCreated: (post: Post) => void; onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [boardType, setBoardType] = useState("normal");
  const [visibility, setVisibility] = useState("public");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const requiresTitle = boardType === "inquiry" || boardType === "report";

  async function submit() {
    if (!content.trim() || submitting) return;
    if (requiresTitle && !title.trim()) { setError(t.titleMissing); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() || null, content: content.trim(), boardType, visibility }),
    });
    if (res.ok) {
      const post = await res.json();
      onCreated({ ...post, likeCount: 0, commentCount: 0, isLiked: false, isOwner: true });
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? t.submitFailed);
    }
    setSubmitting(false);
  }

  const typeStyle = (typ: string) => ({
    padding: "6px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    background: boardType === typ ? BOARD_TYPE_COLORS[typ]?.bg : "rgba(0,0,0,0.04)",
    color: boardType === typ ? BOARD_TYPE_COLORS[typ]?.text : "#64748b",
    border: boardType === typ ? `1px solid ${BOARD_TYPE_COLORS[typ]?.text}30` : "1px solid transparent",
    transition: "all 0.15s",
  });

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold" style={{ color: "#1e293b" }}>{t.newPost}</h2>
        <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>{t.boardSubtitle}</p>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Board type selector */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: "#64748b" }}>{t.boardType}</p>
          <div className="flex gap-2">
            {(["normal", "inquiry", "report"] as const).map((typ) => (
              <button key={typ} onClick={() => setBoardType(typ)} style={typeStyle(typ)}>
                {typ === "normal" ? `💬 ${t.normal}` : typ === "inquiry" ? `❓ ${t.inquiry}` : `🚨 ${t.report}`}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: "#64748b" }}>{t.visibilityLabel}</p>
          <div className="flex gap-2">
            {(["public", "private"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                style={{
                  padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  background: visibility === v ? "rgba(99,102,241,0.1)" : "rgba(0,0,0,0.04)",
                  color: visibility === v ? "#6366f1" : "#64748b",
                  border: visibility === v ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
              >{v === "public" ? t.public : t.private}</button>
            ))}
          </div>
          {visibility === "private" && (
            <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>{t.privateNotice}</p>
          )}
        </div>

        {/* Title */}
        <div className="mb-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={requiresTitle ? t.titleRequired : t.titleOptional}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>

        {/* Content */}
        <div className="flex gap-3">
          <Avatar name={currentUser.name} email={currentUser.email} image={currentUser.image} size={40} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) submit(); }}
              placeholder={
                boardType === "inquiry" ? t.contentPlaceholderInquiry
                  : boardType === "report" ? t.contentPlaceholderReport
                  : t.contentPlaceholderNormal
              }
              rows={5}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b" }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            {error && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={onCancel}
                className="rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(0,0,0,0.04)", color: "#64748b" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              >
                {t.cancel}
              </button>
              <button
                onClick={submit}
                disabled={!content.trim() || submitting}
                className="rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  background: content.trim() && !submitting ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" : "#e2e8f0",
                  color: content.trim() && !submitting ? "#fff" : "#94a3b8",
                  boxShadow: content.trim() && !submitting ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                }}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BoardClient (main) ───────────────────────────────────────────────────────

export function BoardClient({ currentUser }: { currentUser: CurrentUser }) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [view, setView] = useState<"list" | "write" | "detail">("list");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  // display mode: card (기존 카드) | row (목록형)
  const [displayMode, setDisplayMode] = useState<"card" | "row">("card");
  // card mode: load more
  const [cardLimit, setCardLimit] = useState(10);
  // row mode: pagination
  const [listPage, setListPage] = useState(0);
  const [listPageSize, setListPageSize] = useState<10 | 20 | 50>(10);

  const isAdmin = currentUser.email === "kts123@kookmin.ac.kr" || currentUser.email === "fastkjn1@gmail.com";

  useEffect(() => {
    fetch("/api/board/posts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
        else setFetchError("error");
      })
      .catch(() => setFetchError("error"))
      .finally(() => setLoading(false));
  }, []);

  // 필터/모드 변경 시 페이지 초기화
  useEffect(() => { setListPage(0); setCardLimit(10); }, [filterType, displayMode]);

  function handleCreated(post: Post) {
    setFetchError("");
    setLoading(false);
    setPosts((prev) => [post, ...prev]);
    setView("list");
  }

  async function handleDelete(postId: number) {
    const res = await fetch(`/api/board/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setView("list");
    }
  }

  async function handleLike(postId: number) {
    const res = await fetch(`/api/board/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const { liked, likeCount } = await res.json();
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isLiked: liked, likeCount } : p));
    }
  }

  const filteredPosts = filterType === "all" ? posts : posts.filter((p) => p.boardType === filterType);

  if (view === "write") {
    return (
      <div className="w-full lg:max-w-[1214px] mx-auto">
        <button
          onClick={() => setView("list")}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:opacity-70"
          style={{ color: "#6366f1" }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToList}
        </button>
        <WriteForm currentUser={currentUser} onCreated={handleCreated} onCancel={() => setView("list")} />
      </div>
    );
  }

  if (view === "detail" && selectedPostId !== null) {
    return (
      <div className="w-full lg:max-w-[1214px] mx-auto">
        <DetailView
          postId={selectedPostId}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onBack={() => { setView("list"); setSelectedPostId(null); }}
          onDelete={handleDelete}
          onLikeChange={(id, liked, count) => setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isLiked: liked, likeCount: count } : p))}
        />
      </div>
    );
  }

  // 페이지네이션 계산 (row 모드)
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / listPageSize));
  const safeListPage = Math.min(listPage, totalPages - 1);
  const pagedPosts = filteredPosts.slice(safeListPage * listPageSize, (safeListPage + 1) * listPageSize);

  // 카드 모드 표시 목록
  const cardPosts = filteredPosts.slice(0, cardLimit);
  const hasMore = filteredPosts.length > cardLimit;

  const modeBtn = (mode: "card" | "row", icon: React.ReactNode) => (
    <button
      onClick={() => setDisplayMode(mode)}
      className="rounded-lg p-1.5 transition-all duration-150"
      style={{
        background: displayMode === mode ? "rgba(99,102,241,0.12)" : "transparent",
        color: displayMode === mode ? "#6366f1" : "#94a3b8",
        border: displayMode === mode ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
      }}
    >
      {icon}
    </button>
  );

  const handleSelectPost = (id: number) => { setSelectedPostId(id); setView("detail"); };

  return (
    <div className="w-full lg:max-w-[1214px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#1e293b" }}>{t.boardTitle}</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>{t.boardSubtitle}</p>
        </div>
        <button
          onClick={() => setView("write")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.writePost}
        </button>
      </div>

      {/* Service intro */}
      <div
        className="mb-6 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(59,130,246,0.04) 100%)", border: "1px solid rgba(99,102,241,0.12)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
          >
            <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-sm font-bold" style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t.boardSidebarTitle}
          </span>
        </div>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: "#475569" }}>
          {t.boardSidebarDesc}
        </p>
        <div className="grid gap-2 sm:grid-cols-3 mb-4">
          {[
            { emoji: "🌫️", title: t.airQuality, desc: t.dataSourceAirShort, color: "#3b82f6" },
            { emoji: "🌤️", title: t.weather, desc: t.dataSourceWeatherShort, color: "#d97706" },
            { emoji: "🚌", title: t.transit, desc: t.dataSourceTransitShort, color: "#059669" },
          ].map((s) => (
            <div
              key={s.title}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.title}</span>
              </div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>{s.desc}</p>
              <p className="text-xs mt-0.5" style={{ color: "#cbd5e1" }}>apis.data.go.kr</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setView("write")}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {t.contactUs}
        </button>
      </div>

      {/* Filter tabs + view toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {(["all", "normal", "inquiry", "report"] as const).map((ft) => {
            const active = filterType === ft;
            const label = ft === "all" ? t.all : ft === "normal" ? `💬 ${t.normal}` : ft === "inquiry" ? `❓ ${t.inquiry}` : `🚨 ${t.report}`;
            const color = ft === "all" ? { bg: "rgba(99,102,241,0.1)", text: "#6366f1" } : BOARD_TYPE_COLORS[ft];
            return (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150"
                style={{
                  background: active ? color.bg : "rgba(0,0,0,0.04)",
                  color: active ? color.text : "#94a3b8",
                  border: active ? `1px solid ${color.text}25` : "1px solid transparent",
                }}
              >
                {label}
                <span className="ml-1 opacity-60">
                  {ft === "all" ? posts.length : posts.filter((p) => p.boardType === ft).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 ml-2">
          {modeBtn("card",
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
              <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
            </svg>
          )}
          {modeBtn("row",
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full" style={{ background: "#f1f5f9" }} />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded mb-2" style={{ background: "#f1f5f9" }} />
                  <div className="h-2 w-16 rounded" style={{ background: "#f1f5f9" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-3 w-3/4 rounded" style={{ background: "#f1f5f9" }} />
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>{t.noPostsYet}</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>{t.noPostsYet}</p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{t.beFirstToPost}</p>
        </div>
      ) : displayMode === "card" ? (
        /* ── 카드 모드 ── */
        <>
          <div className="space-y-4">
            {cardPosts.map((post) => (
              <PostListItem
                key={post.id}
                post={post}
                isAdmin={isAdmin}
                onSelect={handleSelectPost}
                onDelete={handleDelete}
                onLike={handleLike}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setCardLimit((prev) => prev + 10)}
                className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  color: "#6366f1",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
              >
                {t.loadMore} ({filteredPosts.length - cardLimit})
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── 목록 모드 ── */
        <>
          <div className="space-y-1.5">
            {pagedPosts.map((post) => (
              <PostRowItem
                key={post.id}
                post={post}
                isAdmin={isAdmin}
                onSelect={handleSelectPost}
                onDelete={handleDelete}
                onLike={handleLike}
              />
            ))}
          </div>

          {/* Pagination */}
          {filteredPosts.length > listPageSize && (
            <div className="mt-4 flex items-center justify-between">
              {/* Page size selector */}
              <div className="flex items-center gap-1">
                {([10, 20, 50] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => { setListPageSize(n); setListPage(0); }}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150"
                    style={{
                      background: listPageSize === n ? "rgba(99,102,241,0.1)" : "rgba(0,0,0,0.04)",
                      color: listPageSize === n ? "#6366f1" : "#94a3b8",
                      border: listPageSize === n ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                    }}
                  >
                    {t.perPage(n)}
                  </button>
                ))}
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setListPage((p) => Math.max(0, p - 1))}
                  disabled={safeListPage === 0}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150"
                  style={{
                    background: "rgba(0,0,0,0.04)",
                    color: safeListPage === 0 ? "#cbd5e1" : "#64748b",
                    cursor: safeListPage === 0 ? "default" : "pointer",
                  }}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => Math.abs(i - safeListPage) <= 2)
                  .map((i) => (
                    <button
                      key={i}
                      onClick={() => setListPage(i)}
                      className="rounded-lg w-7 h-7 text-xs font-medium transition-all duration-150"
                      style={{
                        background: safeListPage === i ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" : "rgba(0,0,0,0.04)",
                        color: safeListPage === i ? "#fff" : "#64748b",
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                <button
                  onClick={() => setListPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safeListPage >= totalPages - 1}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150"
                  style={{
                    background: "rgba(0,0,0,0.04)",
                    color: safeListPage >= totalPages - 1 ? "#cbd5e1" : "#64748b",
                    cursor: safeListPage >= totalPages - 1 ? "default" : "pointer",
                  }}
                >
                  ›
                </button>
              </div>

              {/* Total info */}
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                {safeListPage * listPageSize + 1}–{Math.min((safeListPage + 1) * listPageSize, filteredPosts.length)} / {filteredPosts.length}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
