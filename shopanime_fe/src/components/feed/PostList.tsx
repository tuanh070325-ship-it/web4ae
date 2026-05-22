import { memo } from 'react';
import { Forward, MessageCircle, ThumbsUp } from 'lucide-react';
import type { Post } from '../../lib/types';

interface PostListProps {
  posts: Post[];
  onLikePost: (id: number) => void;
}

export const PostList = memo(function PostList({ posts, onLikePost }: PostListProps) {
  return (
    <>
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
            <button onClick={() => onLikePost(post.id)} className="flex-1 py-2 flex items-center justify-center gap-2 border border-[#e63946] rounded-full hover:bg-[#e63946]/10 text-[#e63946] transition-colors text-sm font-bold">
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
    </>
  );
});
