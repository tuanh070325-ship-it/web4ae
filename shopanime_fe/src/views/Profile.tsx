import { FormEvent, useEffect, useState } from "react";
import { User, ShoppingBag, Heart, Settings } from "lucide-react";
import { apiPut } from "../lib/api";
import { useAuth } from "../components/auth/AuthProvider";

export function Profile() {
  const { user, refreshMe } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    phone: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email,
        username: user.username,
        phone: user.phone || "",
      });
    }
  }, [user]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    await apiPut(`/users/${user.id}`, {
      full_name: form.full_name,
      phone: form.phone,
    });
    await refreshMe();
    setMessage("Profile updated");
  };

  return (
    <form onSubmit={saveProfile} className="w-full bg-[#1e2128] min-h-[calc(100vh-72px)] p-8 flex justify-center items-start overflow-hidden">
      <div className="w-full max-w-[1200px] bg-[#141518] rounded-2xl overflow-hidden shadow-2xl border border-[#2e333d]">
        
        {/* Banner */}
        <div className="h-48 w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1614595225026-6b2ad60e86b0?q=80&w=1200&auto=format&fit=crop" 
            alt="Banner" 
            className="w-full h-full object-cover filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141518] to-transparent"></div>
        </div>

        {/* Profile Header */}
        <div className="px-10 pb-10 relative">
          <div className="flex items-end gap-6 -mt-16 mb-10 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-[#141518] overflow-hidden shadow-[0_0_20px_rgba(230,57,70,0.5)] relative">
              <div className="absolute inset-0 border-2 border-red-500 rounded-full z-10 pointer-events-none"></div>
              <img 
                src="https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-white">{user?.full_name || user?.username || "AkibaCore"}</h1>
              <p className="text-[#a0a5b1]">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            
            {/* Sidebar */}
            <div className="w-full md:w-56 space-y-2">
              <button className="w-full flex items-center gap-3 px-5 py-3 bg-[#b0222e] text-white rounded-full font-medium transition-colors">
                <User className="w-5 h-5" />
                Profile Info
              </button>
              <button className="w-full flex items-center gap-3 px-5 py-3 text-[#a0a5b1] hover:text-white hover:bg-[#24262f] rounded-full font-medium transition-colors">
                <ShoppingBag className="w-5 h-5" />
                Orders
              </button>
              <button className="w-full flex items-center gap-3 px-5 py-3 text-[#a0a5b1] hover:text-white hover:bg-[#24262f] rounded-full font-medium transition-colors">
                <Heart className="w-5 h-5" />
                Wishlist
              </button>
              <button className="w-full flex items-center gap-3 px-5 py-3 text-[#a0a5b1] hover:text-white hover:bg-[#24262f] rounded-full font-medium transition-colors">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              
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
                  {["Cyberpunk", "Mecha", "Dark Fantasy", "Shonen", "Seinen"].map(genre => (
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

            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
