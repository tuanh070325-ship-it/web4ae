import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, BookOpen, FileText, FolderTree, Menu, PenTool, Users, X } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: BarChart3 },
  { to: "/admin/products", label: "Products", icon: BookOpen },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: FileText },
  { to: "/admin/authors", label: "Authors", icon: PenTool },
];

export function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <>
      <div className="flex h-12 items-center justify-between gap-2 border-b border-[#273037] px-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-red-500">A</span>
          <span className="text-sm font-bold text-white">AkibaCore Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#273037] text-zinc-300 lg:hidden"
          aria-label="Close admin sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-1 px-2 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              `flex h-10 items-center gap-2 rounded px-3 text-sm font-bold transition-colors ${
                isActive ? "bg-[#d33a3a] text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] bg-[#0c1114] text-zinc-200 lg:min-h-[calc(100vh-72px)]">
      <aside className="hidden w-[168px] shrink-0 border-r border-[#273037] bg-[#171d21] lg:block">
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
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 left-0 z-[60] w-[240px] border-r border-[#273037] bg-[#171d21] shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1 bg-[#0c1114] p-4 sm:p-6">
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
