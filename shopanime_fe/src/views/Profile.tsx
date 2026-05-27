import type { ChangeEvent, FormEvent} from 'react';
import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Pencil, Settings, ShoppingBag, Trash2, User } from 'lucide-react';
import { apiPut } from '../lib/api';
import { useAuth } from '../components/auth/AuthProvider';
import { fileToAvatarDataUrl, getUserAvatar } from '../lib/avatar';

export function Profile() {
  const { user, refreshMe } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    avatar_url: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email,
        username: user.username,
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const saveAvatar = async (avatarUrl: string) => {
    if (!user) {return;}
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      await apiPut(`/users/${user.id}`, { avatar_url: avatarUrl || null });
      setForm((current) => ({ ...current, avatar_url: avatarUrl }));
      await refreshMe();
      setMessage(avatarUrl ? 'Avatar updated' : 'Avatar reset to system default');
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Unable to update avatar');
    } finally {
      setAvatarSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {return;}
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      await saveAvatar(avatarUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Unable to process avatar');
      setAvatarSaving(false);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {return;}
    await apiPut(`/users/${user.id}`, {
      full_name: form.full_name,
      phone: form.phone,
      avatar_url: form.avatar_url || null,
    });
    await refreshMe();
    setMessage('Profile updated');
  };

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 px-5 py-3 rounded-full font-medium transition-colors ${
      isActive
        ? 'bg-[#b0222e] text-white'
        : 'text-[#a0a5b1] hover:text-white hover:bg-[#24262f]'
    }`;

  return (
    <div className="w-full bg-[#1e2128] min-h-[calc(100vh-72px)] p-8 flex justify-center items-start overflow-hidden">
      <div className="w-full max-w-[1200px] bg-[#141518] rounded-2xl overflow-hidden shadow-2xl border border-[#2e333d]">
        
        {/* Banner */}
        <div className="h-48 w-full relative">
          <img 
            src="https://as2.ftcdn.net/v2/jpg/06/83/50/89/1000_F_683508986_x1qzMyQWD3REAulaIOykkwf04iTXdpFO.jpg" 
            alt="Banner" 
            className="w-full h-full object-cover filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141518] to-transparent"></div>
        </div>

        {/* Profile Header */}
        <div className="px-10 pb-10 relative">
          <div className="flex items-end gap-6 -mt-16 mb-10 relative z-10">
            <div className="group relative h-32 w-32 overflow-hidden rounded-full border-4 border-[#141518] shadow-[0_0_20px_rgba(230,57,70,0.5)]">
              <div className="absolute inset-0 border-2 border-red-500 rounded-full z-10 pointer-events-none"></div>
              <img 
                src={getUserAvatar({ avatar_url: form.avatar_url })}
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarSaving}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Upload avatar"
                  title="Upload avatar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void saveAvatar('')}
                  disabled={avatarSaving || !form.avatar_url.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b0222e] text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Remove avatar"
                  title="Remove avatar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input ref={fileInputRef} onChange={uploadAvatar} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-white">{user?.full_name || user?.username || 'AkibaCore'}</h1>
              <p className="text-[#a0a5b1]">{user?.email}</p>
              {avatarSaving && <p className="mt-2 text-xs font-semibold text-[#ff8aa0]">Processing avatar...</p>}
              {avatarError && <p className="mt-2 max-w-md text-xs font-semibold text-red-300">{avatarError}</p>}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            
            {/* Sidebar */}
            <div className="w-full md:w-56 space-y-2">
              <NavLink to="/profile" className={sidebarLinkClass}>
                <User className="w-5 h-5" />
                Profile Info
              </NavLink>
              <NavLink to="/orders" className={sidebarLinkClass}>
                <ShoppingBag className="w-5 h-5" />
                Orders
              </NavLink>
              <NavLink to="/wishlist" className={sidebarLinkClass}>
                <Heart className="w-5 h-5" />
                Wishlist
              </NavLink>
              <button type="button" className="w-full flex items-center gap-3 px-5 py-3 text-[#a0a5b1] hover:text-white hover:bg-[#24262f] rounded-full font-medium transition-colors">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>

            {/* Main Content */}
            <form onSubmit={saveProfile} className="flex-1 space-y-6">
              
              {/* Personal Info */}
              <div className="bg-[#1e2128] rounded-xl p-6 border border-[#2e333d]">
                <h2 className="text-xl font-bold text-white mb-6">Personal Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <label className="text-white ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={form.full_name}
                      onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                      className="w-full bg-[#141518] border border-[#4a5568] focus:border-red-500 rounded-full px-5 py-2.5 text-[#a0a5b1] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="text-white ml-1">Email Address</label>
                    <input 
                      type="text" 
                      value={form.email}
                      disabled
                      className="w-full bg-[#141518] border border-[#4a5568] focus:border-red-500 rounded-full px-5 py-2.5 text-[#a0a5b1] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="text-white ml-1">Username</label>
                    <input 
                      type="text" 
                      value={form.username}
                      disabled
                      className="w-full bg-[#141518] border border-[#4a5568] focus:border-red-500 rounded-full px-5 py-2.5 text-[#a0a5b1] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="text-white ml-1">Phone</label>
                    <input 
                      type="text" 
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full bg-[#141518] border border-[#4a5568] focus:border-red-500 rounded-full px-5 py-2.5 text-[#a0a5b1] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Favorite Genres */}
              <div className="bg-[#1e2128] rounded-xl p-6 border border-[#2e333d]">
                <h2 className="text-xl font-bold text-white mb-6">Favorite Genres</h2>
                <div className="flex flex-wrap gap-3">
                  {['Cyberpunk', 'Mecha', 'Dark Fantasy', 'Shonen', 'Seinen'].map(genre => (
                    <span key={genre} className="px-4 py-1.5 bg-[#401a20] text-[#ff8080] border border-[#802020] rounded-full text-sm font-medium">
                      {genre}
                    </span>
                  ))}
                  <button className="px-4 py-1.5 bg-transparent border border-[#4a5568] text-[#a0a5b1] rounded-full text-sm hover:text-white transition-colors">
                    Add Tag
                  </button>
                </div>
                
                <div className="mt-8 flex justify-end">
                  {message && <span className="mr-4 text-sm text-green-400">{message}</span>}
                  <button type="submit" className="px-6 py-2 bg-[#b0222e] hover:bg-[#8e1923] text-white rounded-full font-medium transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
