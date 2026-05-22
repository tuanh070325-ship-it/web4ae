import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ChatbotWidget } from '../chatbot/ChatbotWidget';

export function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#121212] font-sans text-white">
      <Navbar />
      <main className="flex-1 w-full pt-[94px] sm:pt-[98px] lg:pt-[106px]">
        <Outlet />
      </main>
      <Footer />
      {!isAdminRoute && <ChatbotWidget />}
    </div>
  );
}
