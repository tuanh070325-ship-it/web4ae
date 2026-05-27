import type { FormEvent } from 'react';
import { memo, useState } from 'react';
import { EyeOff, Forward, MessageCircle, Pencil, Send, ThumbsUp, Trash2, X } from 'lucide-react';
import type { Post } from '../../lib/types';
import { getAvatarUrl } from '../../lib/avatar';

interface PostListProps {
  posts: Post[];
  currentUserId: number | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onLikePost: (id: number) => Promise<void>;
  onCreateComment: (postId: number, comment: string) => Promise<void>;
  onUpdateComment: (postId: number, commentId: number, comment: string) => Promise<void>;
  onHideComment: (postId: number, commentId: number) => Promise<void>;
  onDeleteComment: (postId: number, commentId: number) => Promise<void>;
}

export const PostList = memo(function PostList({
  posts,
  currentUserId,
  isAuthenticated,
  isAdmin,
  onLikePost,
  onCreateComment,
  onUpdateComment,
  onHideComment,
  onDeleteComment,
}: PostListProps) {
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [editDrafts, setEditDrafts] = useState<Record<number, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [submittingPostId, setSubmittingPostId] = useState<number | null>(null);
  const [pendingLikePostId, setPendingLikePostId] = useState<number | null>(null);
  const [pendingCommentId, setPendingCommentId] = useState<number | null>(null);

  const submitComment = async (event: FormEvent<HTMLFormElement>, postId: number) => {
    event.preventDefault();
    const draft = commentDrafts[postId]?.trim() || '';
    if (!draft) {return;}
    setSubmittingPostId(postId);
    try {
      await onCreateComment(postId, draft);
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      setOpenComments((current) => ({ ...current, [postId]: true }));
    } finally {
      setSubmittingPostId(null);
    }
  };

  const submitEditComment = async (event: FormEvent<HTMLFormElement>, postId: number, commentId: number) => {
    event.preventDefault();
    const draft = editDrafts[commentId]?.trim() || '';
    if (!draft) {return;}
    setPendingCommentId(commentId);
    try {
      await onUpdateComment(postId, commentId, draft);
      setEditingCommentId(null);
      setEditDrafts((current) => ({ ...current, [commentId]: '' }));
    } finally {
      setPendingCommentId(null);
    }
  };

  const toggleLike = async (postId: number) => {
    if (pendingLikePostId !== null) {return;}
    setPendingLikePostId(postId);
    try {
      await onLikePost(postId);
    } finally {
      setPendingLikePostId(null);
    }
  };

  const sharePost = async (postId: number) => {
    const url = `${window.location.origin}/feed#post-${postId}`;
    await navigator.clipboard?.writeText(url);
  };

  return (
    <>
      {posts.map((post) => (
        <div id={`post-${post.id}`} key={post.id} className="bg-[#1a1b22] border border-[#e63946]/50 shadow-[0_0_15px_rgba(230,57,70,0.15)] rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#e63946]">
                <img src={getAvatarUrl(post.avatar_url)} alt={post.username} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{post.username}</h3>
                <p className="text-xs text-[#5e6677]">{new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <p className="text-white mb-6 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>

          <div className="flex justify-between items-center gap-4">
            <button
              onClick={() => void toggleLike(post.id)}
              disabled={!isAuthenticated || pendingLikePostId === post.id}
              className={`flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full transition-colors text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${post.liked_by_me ? 'bg-[#e63946] text-white' : 'hover:bg-[#e63946]/10 text-[#e63946]'}`}
            >
              <ThumbsUp className="w-4 h-4 fill-current" /> Like ({post.like_count})
            </button>
            <button
              onClick={() => setOpenComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
              className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full text-[#e63946] hover:bg-[#e63946]/10 transition-colors text-sm font-bold"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> Comment ({post.comment_count})
            </button>
            <button onClick={() => void sharePost(post.id)} className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full text-[#e63946] hover:bg-[#e63946]/10 transition-colors text-sm font-bold">
              <Forward className="w-4 h-4 fill-current" /> Share
            </button>
          </div>

          {openComments[post.id] && (
            <div className="mt-5 border-t border-[#2e333d] pt-5">
              <div className="space-y-4">
                {(post.comments || []).map((comment) => {
                  const isHidden = comment.status === 'HIDDEN';
                  const canEdit = !isHidden && currentUserId === comment.user_id;
                  const canDelete = currentUserId === comment.user_id || isAdmin;
                  const canHide = !isHidden && isAdmin;
                  const isEditing = editingCommentId === comment.id;

                  return (
                  <div key={comment.id} className={`flex gap-3 rounded-xl border p-4 ${isHidden ? 'border-yellow-500/35 bg-yellow-500/[0.06]' : 'border-[#2e333d] bg-[#111216]'}`}>
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#e63946]/70">
                      <img src={getAvatarUrl(comment.avatar_url)} alt={comment.username} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-white">{comment.username}</span>
                          <span className="ml-2 text-xs text-[#5e6677]">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                        {canEdit && !isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditDrafts((current) => ({ ...current, [comment.id]: comment.content || '' }));
                            }}
                            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                            aria-label="Edit comment"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canHide && (
                          <button
                            type="button"
                            onClick={() => void onHideComment(post.id, comment.id)}
                            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-yellow-500/10 hover:text-yellow-300"
                            aria-label="Hide comment"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void onDeleteComment(post.id, comment.id)}
                            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                            aria-label="Cancel edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        </div>
                      </div>
                      {isHidden ? (
                        <div className="rounded-lg border border-yellow-500/30 bg-black/20 px-3 py-2 text-sm leading-6 text-yellow-100">
                          <div className="font-bold">This comment was hidden by an administrator.</div>
                          <div className="mt-1 text-xs text-yellow-200/80">System notice: the hidden comment violated AkibaCore community policy.</div>
                        </div>
                      ) : isEditing ? (
                        <form onSubmit={(event) => void submitEditComment(event, post.id, comment.id)} className="mt-2 flex items-end gap-2">
                          <textarea
                            value={editDrafts[comment.id] || ''}
                            onChange={(event) => setEditDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                            maxLength={2000}
                            rows={2}
                            className="min-h-11 flex-1 resize-y rounded-lg border border-[#2e333d] bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-[#e63946]"
                          />
                          <button
                            type="submit"
                            disabled={pendingCommentId === comment.id || !editDrafts[comment.id]?.trim()}
                            className="h-10 rounded-lg bg-[#e63946] px-4 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                          >
                            Save
                          </button>
                        </form>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{comment.content}</p>
                      )}
                    </div>
                  </div>
                  );
                })}
                {(post.comments || []).length === 0 && <div className="text-sm text-zinc-500">No comments yet.</div>}
              </div>

              {isAuthenticated && (
                <form onSubmit={(event) => void submitComment(event, post.id)} className="mt-4 flex items-end gap-3">
                  <textarea
                    value={commentDrafts[post.id] || ''}
                    onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                    maxLength={2000}
                    rows={2}
                    placeholder="Write a comment..."
                    className="min-h-12 flex-1 resize-y rounded-xl border border-[#2e333d] bg-[#111216] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#e63946]"
                  />
                  <button
                    type="submit"
                    disabled={submittingPostId === post.id || !commentDrafts[post.id]?.trim()}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e63946] text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                    aria-label="Post comment"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
});
