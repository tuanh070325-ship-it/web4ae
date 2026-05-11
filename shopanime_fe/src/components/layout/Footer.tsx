import { Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#121212] py-8 text-sm text-zinc-400">
      <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">
            <Facebook className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-5 w-5"
            >
              <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
              <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
            </svg>
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <Youtube className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
