import { Link } from 'react-router-dom';
import { Bookmark, Flame, PackageCheck, Sparkles, TicketPercent } from 'lucide-react';

const promoMessages = [
  {
    badge: 'HELLO',
    label: 'Welcome to AkibaCore - your manga shelf starts here',
    to: '/shop',
    icon: Sparkles,
  },
  {
    badge: 'DROP',
    label: 'Member drop: save up to 24% on selected volumes',
    to: '/shop?sort=popularity',
    icon: TicketPercent,
  },
  {
    badge: 'FREE SHIP',
    label: 'Orders over $50 unlock free shipping',
    to: '/shop',
    icon: PackageCheck,
  },
  {
    badge: 'NEW',
    label: 'New manga drop is live - shop fresh volumes',
    to: '/shop?sort=newest',
    icon: Flame,
  },
  {
    badge: 'SAVE',
    label: 'Wishlist your favorites before they sell out',
    to: '/wishlist',
    icon: Bookmark,
  },
];

const marqueeItems = [...promoMessages, ...promoMessages, ...promoMessages];

export function PromoMarquee() {
  return (
    <div
      className="akiba-promo-shell relative h-[30px] overflow-hidden bg-[#f3efe7] text-[#111216] shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] sm:h-[34px]"
      aria-label="AkibaCore promotions"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f3efe7] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f3efe7] to-transparent" />

      <div
        className="akiba-promo-track flex h-full min-w-max items-center whitespace-nowrap will-change-transform"
        style={{ animation: 'akiba-promo-marquee 15s linear infinite' }}
      >
        {marqueeItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={`${item.badge}-${index}`}
              to={item.to}
              className="flex h-full items-center gap-3 px-5 text-[12px] font-black uppercase tracking-wide text-[#111216] transition-colors hover:text-[#ff0038] focus:text-[#ff0038] focus:outline-none sm:px-7 sm:text-[14px]"
            >
              <span className="hidden h-full w-0.5 bg-[#ff0038] sm:block" />
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#ff0038] sm:h-4 sm:w-4" />
              <span className="bg-[#ff0038] px-2 py-0.5 text-[10px] font-black tracking-widest text-white sm:text-[11px]">
                {item.badge}
              </span>
              <span className="max-w-[72vw] overflow-hidden text-ellipsis sm:max-w-none">
                {item.label}
              </span>
              <span className="text-[#6b6f78]">//</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
