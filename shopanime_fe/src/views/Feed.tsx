import { FormEvent, useEffect, useState } from "react";
import { Forward, MessageCircle, ThumbsUp } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import type { ApiResponse, Post } from "../lib/types";
import { useAuth } from "../components/auth/AuthProvider";

export function Feed() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
    const response = await apiGet<ApiResponse<Post[]>>("/posts");
    setPosts(response.data);
  };

  useEffect(() => {
    loadPosts().catch((err) => setError(err instanceof Error ? err.message : "Unable to load feed"));
  }, []);

  const createPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;
    await apiPost("/posts", { content });
    setContent("");
    await loadPosts();
  };

  const likePost = async (id: number) => {
    if (!isAuthenticated) return;
    await apiPost(`/posts/${id}/like`);
    await loadPosts();
  };

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

          {posts.map((post) => (
            <div key={post.id} className="bg-[#1a1b22] border border-[#e63946]/50 shadow-[0_0_15px_rgba(230,57,70,0.15)] rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#e63946]">
                    <img src={post.avatar_url || `https://i.pravatar.cc/150?u=${post.username}`} alt={post.username} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{post.username}</h3>
                    <p className="text-xs text-[#5e6677]">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <p className="text-white mb-6 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>

              <div className="flex justify-between items-center gap-4">
                <button onClick={() => void likePost(post.id)} className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full hover:bg-[#e63946]/10 text-[#e63946] transition-colors text-sm font-bold">
                  <ThumbsUp className="w-4 h-4 fill-current" /> Like ({post.like_count})
                </button>
                <button className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full text-[#e63946] text-sm font-bold">
                  <MessageCircle className="w-4 h-4 fill-current" /> Comment ({post.comment_count})
                </button>
                <button className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full text-[#e63946] text-sm font-bold">
                  <Forward className="w-4 h-4 fill-current" /> Share
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8 mt-[72px]">
          <div className="bg-[#1a1b22] border border-[#e63946]/50 rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-5 pb-2 border-b-2 border-[#e63946] inline-block">Trending Topics</h3>
            <ul className="space-y-5">
              {["#JujutsuKaisen", "#OnePiece", "#AnimeNews", "#MangaRecommendations"].map((topic) => (
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
