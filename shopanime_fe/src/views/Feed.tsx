import type { FormEvent} from 'react';
import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiMutationResponse, ApiResponse, Post, PostComment } from '../lib/types';
import { useAuth } from '../components/auth/AuthProvider';
import { PostList } from '../components/feed/PostList';

interface LikeResult {
  liked: boolean;
  like_count: number;
}

export function Feed() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const response = await apiGet<ApiResponse<Post[]>>('/posts');
    setPosts(response.data);
  }, []);

  useEffect(() => {
    loadPosts().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load feed'));
  }, []);

  const createPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {return;}
    await apiPost('/posts', { content });
    setContent('');
    await loadPosts();
  };

  const likePost = useCallback(async (id: number) => {
    if (!isAuthenticated) {return;}
    try {
      const response = await apiPost<ApiMutationResponse<LikeResult>>(`/posts/${id}/like`);
      setPosts((current) => current.map((post) => (
        post.id === id
          ? {
            ...post,
            like_count: response.data?.like_count ?? post.like_count,
            liked_by_me: response.data?.liked ?? post.liked_by_me,
          }
          : post
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to like post');
    }
  }, [isAuthenticated]);

  const replaceComment = useCallback((postId: number, nextComment: PostComment, countDelta = 0) => {
    setPosts((current) => current.map((post) => {
      if (post.id !== postId) {return post;}
      return {
        ...post,
        comment_count: Math.max(0, Number(post.comment_count || 0) + countDelta),
        comments: (post.comments || []).map((comment) => (comment.id === nextComment.id ? nextComment : comment)),
      };
    }));
  }, []);

  const createComment = useCallback(async (postId: number, comment: string) => {
    if (!isAuthenticated || !comment.trim()) {return;}
    const response = await apiPost<ApiMutationResponse<PostComment>>(`/posts/${postId}/comments`, { content: comment });
    const createdComment = response.data;
    if (!createdComment) {return;}
    setPosts((current) => current.map((post) => {
      if (post.id !== postId) {return post;}
      return {
        ...post,
        comment_count: Number(post.comment_count || 0) + 1,
        comments: [...(post.comments || []), createdComment],
      };
    }));
  }, [isAuthenticated]);

  const deleteComment = useCallback(async (postId: number, commentId: number) => {
    if (!isAuthenticated) {return;}
    await apiDelete(`/posts/${postId}/comments/${commentId}`);
    setPosts((current) => current.map((post) => {
      if (post.id !== postId) {return post;}
      return {
        ...post,
        comment_count: Math.max(0, Number(post.comment_count || 0) - 1),
        comments: (post.comments || []).filter((comment) => comment.id !== commentId),
      };
    }));
  }, [isAuthenticated]);

  const updateComment = useCallback(async (postId: number, commentId: number, comment: string) => {
    if (!isAuthenticated || !comment.trim()) {return;}
    const response = await apiPut<ApiMutationResponse<PostComment>>(`/posts/${postId}/comments/${commentId}`, { content: comment });
    if (response.data) {
      replaceComment(postId, response.data);
    }
  }, [isAuthenticated, replaceComment]);

  const hideComment = useCallback(async (postId: number, commentId: number) => {
    if (!isAdmin) {return;}
    const response = await apiPut<ApiMutationResponse<PostComment>>(`/posts/${postId}/comments/${commentId}/hide`);
    if (response.data) {
      replaceComment(postId, response.data, -1);
    }
  }, [isAdmin, replaceComment]);

  return (
    <div className="w-full bg-[#111216] min-h-[calc(100vh-72px)] py-12 px-8 font-sans relative overflow-hidden text-[#a0a5b1]">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 relative z-10">
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-wide border-b-4 border-[#e63946] inline-block pb-2">
              Community Feed
            </h1>
          </div>

          {isAuthenticated && (
            <form onSubmit={createPost} className="bg-[#1a1b22] border border-[#e63946]/50 rounded-2xl p-6">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share your latest manga haul..."
                className="w-full min-h-28 bg-[#111216] border border-[#2e333d] rounded-xl p-4 text-white focus:outline-none focus:border-[#e63946]"
              />
              <div className="mt-4 flex justify-end">
                <button className="bg-[#e63946] hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold">Post</button>
              </div>
            </form>
          )}

          {error && <div className="text-red-400">{error}</div>}

          <PostList
            posts={posts}
            currentUserId={user?.id ?? null}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            onLikePost={likePost}
            onCreateComment={createComment}
            onUpdateComment={updateComment}
            onHideComment={hideComment}
            onDeleteComment={deleteComment}
          />
        </div>

        <div className="space-y-8 mt-[72px]">
          <div className="bg-[#1a1b22] border border-[#e63946]/50 rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-5 pb-2 border-b-2 border-[#e63946] inline-block">Trending Topics</h3>
            <ul className="space-y-5">
              {['#JujutsuKaisen', '#OnePiece', '#AnimeNews', '#MangaRecommendations'].map((topic) => (
                <li key={topic}>
                  <div className="font-bold text-white mb-0.5">{topic}</div>
                  <div className="text-xs text-[#a0a5b1]">Community discussion</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
