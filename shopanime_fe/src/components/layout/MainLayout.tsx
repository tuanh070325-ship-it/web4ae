import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ChatbotWidget } from "../chatbot/ChatbotWidget";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#121212] font-sans text-white">
      <Navbar />
      <main className="flex-1 w-full pt-[94px] sm:pt-[98px] lg:pt-[106px]">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
