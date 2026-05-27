import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, FileText, FolderTree, LogOut, Menu, PenTool, Users, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getUserAvatar } from '../../lib/avatar';
import logoIcon from '../../../img/logo.png';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: BookOpen },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: FileText },
  { to: '/admin/authors', label: 'Authors', icon: PenTool },
];

export function AdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 items-center justify-between gap-3 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logoIcon.src} alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0">
            <div className="truncate text-[20px] font-black leading-tight tracking-wide text-white">AkibaCore</div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-400">Admin</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#273037] text-zinc-300 transition-colors hover:border-red-500/70 hover:text-white lg:hidden"
          aria-label="Close admin sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex h-12 items-center gap-3 rounded px-4 text-[15px] font-black transition-colors ${
                isActive ? 'bg-[#e63946] text-white shadow-[0_14px_28px_rgba(230,57,70,0.18)]' : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2.1} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#273037] p-4">
        <div className="flex min-w-0 items-center gap-3 rounded bg-[#101417] p-3">
          <img src={getUserAvatar(user)} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-[#273037]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black text-white">{user?.username || 'Admin'}</div>
            <div className="truncate text-xs font-semibold text-zinc-500">{user?.email || 'AkibaCore admin'}</div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] bg-[#0c1114] text-zinc-200 lg:min-h-[calc(100vh-72px)] lg:pl-[284px]">
      <aside className="hidden w-[284px] shrink-0 border-r border-[#273037] bg-[#171d21] lg:fixed lg:bottom-0 lg:left-0 lg:top-[106px] lg:z-30 lg:block">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[55] bg-black/65 backdrop-blur-sm lg:hidden"
              aria-label="Close admin sidebar overlay"
            />
            <motion.aside
              initial={{ x: -304 }}
              animate={{ x: 0 }}
              exit={{ x: -304 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 left-0 z-[60] w-[304px] max-w-[calc(100vw-32px)] border-r border-[#273037] bg-[#171d21] shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1 bg-[#0c1114] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mb-4 inline-flex items-center gap-2 rounded border border-[#343d43] bg-[#171d21] px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-colors hover:border-red-500/70 lg:hidden"
        >
          <Menu className="h-4 w-4" />
          Admin Menu
        </button>
        <Outlet />
      </main>
    </section>
  );
}
