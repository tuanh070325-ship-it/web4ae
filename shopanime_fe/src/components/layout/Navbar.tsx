import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { PromoMarquee } from "./PromoMarquee";
import { apiGet } from "../../lib/api";
import { formatUsd, getProductFinalPrice, getProductImage, getProductPath } from "../../lib/format";
import type { ApiResponse, CartItem, WishlistItem } from "../../lib/types";
import logoIcon from "../../../img/logo.png";

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
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const currentSearch = new URLSearchParams(location.search).get("search") || "";
    setSearchQuery(currentSearch);
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartCount(0);
      setWishlistCount(0);
      setCartItems([]);
      setWishlistItems([]);
      return;
    }

    let cancelled = false;
    const loadCounts = async () => {
      try {
        const [cartResponse, wishlistResponse] = await Promise.all([
          apiGet<ApiResponse<CartItem[]>>("/cart", { suppressUnauthorizedEvent: true }),
          apiGet<ApiResponse<WishlistItem[]>>("/wishlist", { suppressUnauthorizedEvent: true }),
        ]);
        if (!cancelled) {
          const nextCartItems = cartResponse.data;
          const nextWishlistItems = wishlistResponse.data;
          setCartItems(nextCartItems);
          setWishlistItems(nextWishlistItems);
          setCartCount(nextCartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
          setWishlistCount(nextWishlistItems.length);
        }
      } catch {
        if (!cancelled) {
          setCartCount(0);
          setWishlistCount(0);
          setCartItems([]);
          setWishlistItems([]);
        }
      }
    };

    void loadCounts();
    window.addEventListener("akibacore:cart-updated", loadCounts);
    window.addEventListener("akibacore:wishlist-updated", loadCounts);

    return () => {
      cancelled = true;
      window.removeEventListener("akibacore:cart-updated", loadCounts);
      window.removeEventListener("akibacore:wishlist-updated", loadCounts);
    };
  }, [isAuthenticated, location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    const pathname = path.split("?")[0];
    return location.pathname === pathname || (pathname === "/shop" && location.pathname.startsWith("/product"));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  const previewPanelClass = "invisible absolute right-0 top-full z-50 mt-3 w-[340px] translate-y-2 rounded-xl border border-[#2e333d] bg-[#111216] p-4 opacity-0 shadow-2xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100";

  const renderPreviewPanel = (
    items: Array<CartItem | WishlistItem>,
    type: "cart" | "wishlist",
  ) => {
    const visibleItems = items.slice(0, 3);
    const total = type === "cart"
      ? (items as CartItem[]).reduce((sum, item) => sum + getProductFinalPrice(item) * item.quantity, 0)
      : 0;
    const target = type === "cart" ? "/cart" : "/wishlist";
    const title = type === "cart" ? "Cart preview" : "Wishlist preview";
    const emptyText = type === "cart" ? "Your cart is empty." : "No saved products yet.";

    return (
      <div className={previewPanelClass}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-widest text-white">{title}</div>
          <Link to={target} className="text-xs font-black uppercase tracking-widest text-[#e63946] hover:text-[#ff4d5a]">
            View all
          </Link>
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-lg border border-[#2e333d] bg-black/20 px-4 py-6 text-center text-sm font-semibold text-zinc-500">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <Link key={`${type}-${"cart_item_id" in item ? item.cart_item_id : item.wishlist_item_id}`} to={getProductPath(item)} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.04]">
                <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded bg-white p-1">
                  <img src={getProductImage(item)} alt={item.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-bold leading-5 text-white">{item.name}</div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs font-bold text-zinc-500">
                    <span>{formatUsd(getProductFinalPrice(item))}</span>
                    {"quantity" in item && <span>x{item.quantity}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {type === "cart" && visibleItems.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-[#2e333d] pt-3 text-sm">
            <span className="font-bold text-zinc-500">Subtotal</span>
            <span className="font-black text-white">{formatUsd(total)}</span>
          </div>
        )}
      </div>
    );
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

      <div className="group relative">
        <Link to="/wishlist" className={`flex items-center gap-2 hover:text-[#e63946] transition-colors text-[14px] font-bold ${location.pathname.startsWith('/wishlist') ? 'text-[#e63946]' : 'text-white'}`}>
          <span className="relative">
            <Heart className="h-[22px] w-[22px]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e63946] px-1 text-[10px] font-bold text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </span>
          <span>Wishlist</span>
        </Link>
        <div className="hidden lg:block">{renderPreviewPanel(wishlistItems, "wishlist")}</div>
      </div>

      <div className="group relative">
        <Link to="/cart" className={`flex items-center gap-2 hover:text-[#e63946] transition-colors text-[14px] font-bold ${location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout') ? 'text-[#e63946]' : 'text-white'}`}>
          <span className="relative">
            <ShoppingCart className="h-[22px] w-[22px]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e63946] px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
          <span>Cart</span>
        </Link>
        <div className="hidden lg:block">{renderPreviewPanel(cartItems, "cart")}</div>
      </div>

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
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#2e333d] bg-[#111216] text-[#a0a5b1]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 lg:h-[72px] flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center group transition-colors">
            <span className="flex items-center gap-2">
              <img src={logoIcon.src} alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
              <span className="text-[22px] sm:text-[26px] tracking-wide font-black text-white transition-colors group-hover:text-[#e63946]">
                AkibaCore
              </span>
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

        <form onSubmit={submitSearch} className="flex-1 max-w-[500px] mx-8 hidden xl:block">
           <div className="relative flex items-center">
             <input
               type="text"
               value={searchQuery}
               onChange={(event) => setSearchQuery(event.target.value)}
               placeholder="Search Manga, Figures, etc..."
               className="w-full bg-[#1a1b22] border border-[#2e333d] focus:border-[#e63946] rounded-full py-2.5 pl-5 pr-12 text-[14px] text-white focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
             />
             <button type="submit" className="absolute right-1 w-[34px] h-[34px] flex items-center justify-center bg-[#e63946] hover:bg-[#ff4d5a] rounded-full text-white transition-colors" aria-label="Search products">
               <Search className="w-4 h-4 fill-current stroke-[3]" />
             </button>
           </div>
        </form>

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
            <form onSubmit={submitSearch} className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search manga, figures..."
                className="w-full rounded-full border border-[#2e333d] bg-[#1a1b22] py-3 pl-4 pr-12 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#e63946]"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#e63946] text-white" aria-label="Search products">
                <Search className="h-4 w-4 stroke-[3]" />
              </button>
            </form>

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
