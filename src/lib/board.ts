import { db } from "./db";
import { posts, postLikes, comments, boardReplies, boardStatusHistory, commentReactions } from "./schema";
import { eq, desc, count, and, inArray, sql } from "drizzle-orm";

export const ADMIN_EMAILS = ["kts123@kookmin.ac.kr", "fastkjn1@gmail.com"];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export type PostWithMeta = {
  id: number;
  authorEmail: string;
  authorName: string | null;
  authorImage: string | null;
  title: string | null;
  content: string;
  serviceUrl: string | null;
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

export type BoardReply = {
  id: number;
  postId: number;
  adminEmail: string;
  adminName: string | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export async function getPosts(currentUserEmail?: string): Promise<PostWithMeta[]> {
  const isAdmin = currentUserEmail ? isAdminEmail(currentUserEmail) : false;

  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));

  // Filter by visibility permissions
  const visiblePosts = allPosts.filter((post) => {
    if (isAdmin) return true; // admin sees everything
    if (post.visibility === "admin_only") return false;
    if (post.visibility === "private") return post.authorEmail === currentUserEmail;
    return true; // public
  });

  if (visiblePosts.length === 0) return [];

  const visibleIds = visiblePosts.map((p) => p.id);

  const likeCounts = await db
    .select({ postId: postLikes.postId, cnt: count() })
    .from(postLikes)
    .groupBy(postLikes.postId);

  const commentCounts = await db
    .select({ postId: comments.postId, cnt: count() })
    .from(comments)
    .groupBy(comments.postId);

  let userLikeSet = new Set<number>();
  if (currentUserEmail) {
    const userLikes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(eq(postLikes.userEmail, currentUserEmail));
    userLikeSet = new Set(userLikes.map((l) => l.postId));
  }

  const likeMap = new Map(likeCounts.map((l) => [l.postId, l.cnt]));
  const commentMap = new Map(commentCounts.map((c) => [c.postId, c.cnt]));

  return visiblePosts.map((post) => ({
    ...post,
    likeCount: likeMap.get(post.id) ?? 0,
    commentCount: commentMap.get(post.id) ?? 0,
    isLiked: userLikeSet.has(post.id),
    isOwner: post.authorEmail === currentUserEmail,
  }));
}

export async function getPost(postId: number, currentUserEmail?: string): Promise<PostWithMeta | null> {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return null;

  const isAdmin = currentUserEmail ? isAdminEmail(currentUserEmail) : false;

  // Check visibility
  if (!isAdmin) {
    if (post.visibility === "admin_only") return null;
    if (post.visibility === "private" && post.authorEmail !== currentUserEmail) return null;
  }

  const [likeCountRow] = await db
    .select({ cnt: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));

  const [commentCountRow] = await db
    .select({ cnt: count() })
    .from(comments)
    .where(eq(comments.postId, postId));

  let isLiked = false;
  if (currentUserEmail) {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userEmail, currentUserEmail)))
      .limit(1);
    isLiked = !!like;
  }

  return {
    ...post,
    likeCount: likeCountRow?.cnt ?? 0,
    commentCount: commentCountRow?.cnt ?? 0,
    isLiked,
    isOwner: post.authorEmail === currentUserEmail,
  };
}

export type CommentNode = {
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

export async function getComments(postId: number, currentUserEmail?: string): Promise<CommentNode[]> {
  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);

  if (allComments.length === 0) return [];

  const commentIds = allComments.map((c) => c.id);

  // Reaction counts per comment (graceful fallback if table doesn't exist yet)
  let reactionCounts: { commentId: number; type: string; cnt: number }[] = [];
  let myReactions: { commentId: number; type: string }[] = [];
  try {
    reactionCounts = await db
      .select({
        commentId: commentReactions.commentId,
        type: commentReactions.type,
        cnt: count(),
      })
      .from(commentReactions)
      .where(inArray(commentReactions.commentId, commentIds))
      .groupBy(commentReactions.commentId, commentReactions.type);

    if (currentUserEmail) {
      myReactions = await db
        .select({ commentId: commentReactions.commentId, type: commentReactions.type })
        .from(commentReactions)
        .where(
          and(
            inArray(commentReactions.commentId, commentIds),
            eq(commentReactions.userEmail, currentUserEmail)
          )
        );
    }
  } catch {
    // comment_reactions table may not exist yet — reactions default to 0
  }

  const likeMap = new Map<number, number>();
  const dislikeMap = new Map<number, number>();
  reactionCounts.forEach(({ commentId, type, cnt }) => {
    if (type === "like") likeMap.set(commentId, cnt);
    else dislikeMap.set(commentId, cnt);
  });
  const myReactionMap = new Map(myReactions.map((r) => [r.commentId, r.type as "like" | "dislike"]));

  const nodeMap = new Map<number, CommentNode>();
  allComments.forEach((c) =>
    nodeMap.set(c.id, {
      ...c,
      likeCount: likeMap.get(c.id) ?? 0,
      dislikeCount: dislikeMap.get(c.id) ?? 0,
      myReaction: myReactionMap.get(c.id) ?? null,
      replies: [],
    })
  );

  const topLevel: CommentNode[] = [];
  allComments.forEach((c) => {
    const node = nodeMap.get(c.id)!;
    if (c.parentId && nodeMap.has(c.parentId)) {
      nodeMap.get(c.parentId)!.replies.push(node);
    } else {
      topLevel.push(node);
    }
  });

  return topLevel;
}

export async function reactToComment(
  commentId: number,
  userEmail: string,
  type: "like" | "dislike"
): Promise<{ likeCount: number; dislikeCount: number; myReaction: "like" | "dislike" | null }> {
  const [existing] = await db
    .select()
    .from(commentReactions)
    .where(and(eq(commentReactions.commentId, commentId), eq(commentReactions.userEmail, userEmail)))
    .limit(1);

  if (existing) {
    if (existing.type === type) {
      // Same type → toggle off
      await db.delete(commentReactions).where(eq(commentReactions.id, existing.id));
    } else {
      // Different type → switch
      await db
        .update(commentReactions)
        .set({ type })
        .where(eq(commentReactions.id, existing.id));
    }
  } else {
    await db.insert(commentReactions).values({ commentId, userEmail, type });
  }

  const counts = await db
    .select({ type: commentReactions.type, cnt: count() })
    .from(commentReactions)
    .where(eq(commentReactions.commentId, commentId))
    .groupBy(commentReactions.type);

  const [myNew] = await db
    .select()
    .from(commentReactions)
    .where(and(eq(commentReactions.commentId, commentId), eq(commentReactions.userEmail, userEmail)))
    .limit(1);

  return {
    likeCount: counts.find((c) => c.type === "like")?.cnt ?? 0,
    dislikeCount: counts.find((c) => c.type === "dislike")?.cnt ?? 0,
    myReaction: (myNew?.type as "like" | "dislike") ?? null,
  };
}

export async function getBoardReplies(postId: number, includeInternal = false): Promise<BoardReply[]> {
  const all = await db
    .select()
    .from(boardReplies)
    .where(eq(boardReplies.postId, postId))
    .orderBy(boardReplies.createdAt);

  return includeInternal ? all : all.filter((r) => !r.isInternal);
}

export async function toggleLike(
  postId: number,
  userEmail: string
): Promise<{ liked: boolean; likeCount: number }> {
  const [existing] = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userEmail, userEmail)))
    .limit(1);

  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
  } else {
    await db.insert(postLikes).values({ postId, userEmail });
  }

  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));

  return { liked: !existing, likeCount: cnt };
}

export async function createPost(data: {
  authorEmail: string;
  authorName?: string | null;
  authorImage?: string | null;
  title?: string | null;
  content: string;
  serviceUrl?: string | null;
  boardType?: string;
  visibility?: string;
}) {
  const [inserted] = await db
    .insert(posts)
    .values({
      authorEmail: data.authorEmail,
      authorName: data.authorName ?? null,
      authorImage: data.authorImage ?? null,
      title: data.title ?? null,
      content: data.content,
      serviceUrl: data.serviceUrl ?? null,
      boardType: data.boardType ?? "normal",
      visibility: data.visibility ?? "public",
      answerStatus: data.boardType === "normal" ? "none" : "pending",
    })
    .returning();
  return inserted;
}

export async function updatePostContent(
  postId: number,
  authorEmail: string,
  data: { title?: string | null; content?: string; serviceUrl?: string | null }
) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");
  if (post.authorEmail !== authorEmail) throw new Error("Forbidden");

  await db
    .update(posts)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(posts.id, postId));
}

export async function updatePostStatus(
  postId: number,
  adminEmail: string,
  updates: {
    processStatus?: string;
    answerStatus?: string;
    visibility?: string;
  }
) {
  const [current] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!current) throw new Error("Post not found");

  await db
    .update(posts)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(posts.id, postId));

  // Record history
  const entries = Object.entries(updates) as [string, string][];
  for (const [field, toValue] of entries) {
    const fromValue = current[field as keyof typeof current] as string;
    if (fromValue !== toValue) {
      await db.insert(boardStatusHistory).values({
        postId,
        changedBy: adminEmail,
        field,
        fromValue,
        toValue,
      });
    }
  }
}

export async function createBoardReply(data: {
  postId: number;
  adminEmail: string;
  adminName?: string | null;
  content: string;
  isInternal?: boolean;
}) {
  const [reply] = await db
    .insert(boardReplies)
    .values({
      postId: data.postId,
      adminEmail: data.adminEmail,
      adminName: data.adminName ?? null,
      content: data.content,
      isInternal: data.isInternal ?? false,
    })
    .returning();

  // Mark post as having admin reply and update answer status
  await db
    .update(posts)
    .set({
      hasAdminReply: true,
      answerStatus: "answered",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, data.postId));

  return reply;
}

export async function deleteBoardReply(replyId: number, adminEmail: string) {
  if (!isAdminEmail(adminEmail)) throw new Error("Forbidden");
  await db.delete(boardReplies).where(eq(boardReplies.id, replyId));
}
