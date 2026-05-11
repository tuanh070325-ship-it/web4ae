import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { PromoMarquee } from "./PromoMarquee";

const primaryLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop?category=manga", label: "Manga" },
  { to: "/shop?category=figures", label: "Figures" },
  { to: "/shop?category=merch", label: "Merch" },
  { to: "/feed", label: "Feed" },
];

export function Navbar() {
  const location = useLocation();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    const pathname = path.split("?")[0];
    return location.pathname === pathname || (pathname === "/shop" && location.pathname.startsWith("/product"));
  };

  const accountLinks = (
    <>
      {isAuthenticated ? (
        <Link to="/profile" className={`flex items-center gap-2 hover:text-[#e63946] transition-colors text-[14px] font-bold ${location.pathname.startsWith('/profile') ? 'text-[#e63946]' : 'text-white'}`}>
          <User className="h-[22px] w-[22px]" />
          <span>{user?.username || "Account"}</span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 text-[14px] font-bold">
          <Link to="/login" className="text-white hover:text-[#e63946] transition-colors">Login</Link>
          <span className="text-zinc-700">/</span>
          <Link to="/register" className="text-white hover:text-[#e63946] transition-colors">Register</Link>
        </div>
      )}

      <Link to="/wishlist" className={`flex items-center gap-2 hover:text-[#e63946] transition-colors text-[14px] font-bold ${location.pathname.startsWith('/wishlist') ? 'text-[#e63946]' : 'text-white'}`}>
        <Heart className="h-[22px] w-[22px]" />
        <span>Wishlist</span>
      </Link>

      <Link to="/cart" className={`flex items-center gap-2 hover:text-[#e63946] transition-colors text-[14px] font-bold ${location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout') ? 'text-[#e63946]' : 'text-white'}`}>
        <span className="relative">
          <ShoppingCart className="h-[22px] w-[22px]" />
          <span className="absolute -top-2 -right-2 bg-[#e63946] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
        </span>
        <span>Cart</span>
      </Link>

      {isAdmin && (
        <Link
          to="/admin"
          className={`flex items-center justify-center gap-2 rounded border px-3 py-2 text-[13px] font-black tracking-wide transition-colors ${
            location.pathname.startsWith("/admin")
              ? "border-[#e63946] bg-[#e63946] text-white"
              : "border-[#e63946]/50 text-white hover:border-[#e63946] hover:bg-[#e63946]"
          }`}
        >
          <LayoutDashboard className="h-[18px] w-[18px]" />
          <span>ADMIN</span>
        </Link>
      )}

      {isAuthenticated && (
        <button
          onClick={() => void logout()}
          className="flex items-center gap-2 text-white hover:text-[#e63946] transition-colors text-[14px] font-bold"
        >
          <LogOut className="h-[20px] w-[20px]" />
          <span>Logout</span>
        </button>
      )}
    </>
  );

  return (
    <nav className="border-b border-[#2e333d] bg-[#111216] text-[#a0a5b1] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 lg:h-[72px] flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center group transition-colors">
            <span className="text-[22px] sm:text-[26px] tracking-wide font-black flex items-center gap-1.5">
              <span className="text-[#e63946]"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13l6.5-13z"/></svg></span>
              <span className="text-white group-hover:text-[#e63946] transition-colors">AkibaCore</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[15px] font-bold">
            {primaryLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`hover:text-[#e63946] transition-colors border-b-2 py-6 ${isActive(link.to) ? 'text-white border-[#e63946]' : 'text-[#a0a5b1] border-transparent'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1 max-w-[500px] mx-8 hidden xl:block">
           <div className="relative flex items-center">
             <input
               type="text"
               placeholder="Search Manga, Figures, etc..."
               className="w-full bg-[#1a1b22] border border-[#2e333d] focus:border-[#e63946] rounded-full py-2.5 pl-5 pr-12 text-[14px] text-white focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
             />
             <button className="absolute right-1 w-[34px] h-[34px] flex items-center justify-center bg-[#e63946] hover:bg-[#ff4d5a] rounded-full text-white transition-colors">
               <Search className="w-4 h-4 fill-current stroke-[3]" />
             </button>
           </div>
        </div>

        <div className="hidden lg:flex items-center justify-end gap-5 min-w-max">
          {accountLinks}
        </div>

        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2e333d] bg-[#1a1b22] text-white shadow-[0_0_18px_rgba(230,57,70,0.18)] transition-colors hover:border-[#e63946]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <PromoMarquee />

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden border-t border-[#2e333d] bg-[#111216]/98 px-4 pb-5 pt-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search manga, figures..."
                className="w-full rounded-full border border-[#2e333d] bg-[#1a1b22] py-3 pl-4 pr-12 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#e63946]"
              />
              <button className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#e63946] text-white">
                <Search className="h-4 w-4 stroke-[3]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {primaryLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg border px-4 py-3 text-sm font-black uppercase tracking-wide transition-colors ${
                    isActive(link.to)
                      ? "border-[#e63946] bg-[#e63946] text-white"
                      : "border-[#2e333d] bg-[#1a1b22] text-zinc-300 hover:border-[#e63946]/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-[#2e333d] bg-black/20 p-4">
              {accountLinks}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
