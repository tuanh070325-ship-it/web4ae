import type { FormEvent} from 'react';
import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import type { ApiResponse, Post } from '../lib/types';
import { useAuth } from '../components/auth/AuthProvider';
import { PostList } from '../components/feed/PostList';

export function Feed() {
  const { isAuthenticated } = useAuth();
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
    setPosts((current) => current.map((post) => (post.id === id ? { ...post, like_count: Number(post.like_count || 0) + 1 } : post)));
    try {
      await apiPost(`/posts/${id}/like`);
    } catch (err) {
      setPosts((current) => current.map((post) => (post.id === id ? { ...post, like_count: Math.max(0, Number(post.like_count || 0) - 1) } : post)));
      setError(err instanceof Error ? err.message : 'Unable to like post');
    }
  }, [isAuthenticated]);

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

          <PostList posts={posts} onLikePost={likePost} />
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
