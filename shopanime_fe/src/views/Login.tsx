import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Bookmark, Eye, EyeOff, Heart, LockKeyhole, ShoppingBag, Sparkles, TicketPercent } from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";

const featuredCovers = [
  { title: "Berserk", image: "https://myanimelist.net/images/manga/1/157897l.jpg", price: "$13.99", tag: "Dark fantasy" },
  { title: "One Piece", image: "https://myanimelist.net/images/manga/2/253146l.jpg", price: "$15.29", tag: "Member deal" },
  { title: "Vagabond", image: "https://myanimelist.net/images/manga/1/259070l.jpg", price: "$15.99", tag: "Trending" },
];

const benefitBadges = [
  { icon: Bookmark, label: "Wishlist saved" },
  { icon: ShoppingBag, label: "Cart synced" },
  { icon: TicketPercent, label: "Member deals" },
];

function loginContextCopy(redirect: string | null) {
  if (redirect?.includes("wishlist")) return "Login to open your saved manga list.";
  if (redirect?.includes("cart") || redirect?.includes("checkout")) return "Login to sync your cart and finish checkout.";
  if (redirect?.includes("product")) return "Login to save this volume or add it to cart.";
  return "Continue your manga hunt.";
}

function friendlyLoginError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid credentials") || normalized.includes("unauthorized")) return "Email or password is incorrect.";
  if (normalized.includes("internal server") || normalized.includes("failed to fetch")) return "Login service is temporarily unavailable.";
  return message;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const contextCopy = useMemo(() => loginContextCopy(redirect), [redirect]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSocialNotice(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      const defaultPath = ["ADMIN", "MANAGER"].includes(user.role?.toUpperCase() ?? "") ? "/admin" : "/";
      navigate(redirect || defaultPath, { replace: true });
    } catch (err) {
      setError(friendlyLoginError(err instanceof Error ? err.message : "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const showComingSoon = (provider: string) => {
    setSocialNotice(`${provider} login is coming soon. Use email login for now.`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(116deg,#030303_0%,#150006_38%,#050505_76%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,0,56,0.38),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(255,0,56,0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,0,56,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,56,0.2)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#ff0038]" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-7 sm:px-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(400px,0.84fr)] xl:px-8 xl:py-10">
        <section className="hidden min-h-[700px] flex-col justify-center xl:flex">
          <Link to="/" className="mb-10 inline-flex w-fit items-center gap-3 text-2xl font-black tracking-tight text-white">
            <span className="text-4xl leading-none text-[#ff0038]">A</span>
            <span>AkibaCore</span>
          </Link>

          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 bg-[#ff0038] px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.85)]">
              <Sparkles className="h-4 w-4" />
              Member Manga Gate
            </div>
            <h1 className="max-w-2xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white 2xl:text-6xl">
              Your manga shelf is waiting.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-zinc-300 2xl:text-lg">
              Login to track your wishlist, keep carts synced, and catch member-only manga drops before they disappear.
            </p>
          </div>

          <div className="relative mt-10 h-[360px] max-w-[650px] 2xl:h-[390px] 2xl:max-w-3xl">
            <div className="absolute left-2 top-8 h-64 w-64 bg-[#ff0038]/18 blur-3xl" />
            {featuredCovers.map((cover, index) => {
              const positions = [
                "left-4 top-14 z-30 rotate-[-7deg] 2xl:left-8",
                "left-[205px] top-0 z-40 rotate-[4deg] 2xl:left-[240px]",
                "left-[405px] top-20 z-20 rotate-[8deg] 2xl:left-[475px] 2xl:top-16",
              ];
              return (
                <motion.div
                  key={cover.title}
                  animate={{ y: [0, index === 1 ? -12 : -7, 0] }}
                  transition={{ duration: 3 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute w-40 overflow-hidden bg-zinc-950 shadow-[0_28px_70px_rgba(0,0,0,0.58),6px_6px_0_0_rgba(255,0,56,0.58)] 2xl:w-48 ${positions[index]}`}
                >
                  <div className="aspect-[2/3] overflow-hidden bg-zinc-900">
                    <img src={cover.image} alt={cover.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="bg-black/95 p-3">
                    <div className="line-clamp-1 text-sm font-black uppercase text-white">{cover.title}</div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-black text-[#ff8aa0]">{cover.price}</span>
                      <span className="text-zinc-500">{cover.tag}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.div
              animate={{ scale: [1, 1.04, 1], rotate: [-2, 2, -2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[330px] top-[222px] z-50 bg-[#ff0038] px-4 py-3 text-base font-black uppercase tracking-wider text-white shadow-[0_0_26px_rgba(255,0,56,0.62),5px_5px_0_0_rgba(0,0,0,0.8)] 2xl:left-[390px] 2xl:top-[238px] 2xl:px-5 2xl:text-lg"
            >
              -24% member drop
            </motion.div>
          </div>

          <div className="mt-4 grid max-w-[650px] grid-cols-3 gap-3 2xl:max-w-3xl">
            {benefitBadges.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 bg-white/[0.05] px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-200 shadow-[inset_4px_0_0_#ff0038]">
                  <Icon className="h-5 w-5 text-[#ff0038]" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[460px] xl:max-w-[430px] 2xl:max-w-[460px]">
          <div className="mb-6 text-center xl:hidden">
            <Link to="/" className="inline-flex items-center justify-center gap-3 text-2xl font-black tracking-tight text-white">
              <span className="text-4xl leading-none text-[#ff0038]">A</span>
              <span>AkibaCore</span>
            </Link>
            <p className="mt-3 text-sm font-semibold text-zinc-400">Your manga shelf is waiting.</p>
          </div>

          <div className="relative overflow-hidden bg-[#101116] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.52),0_0_0_1px_rgba(255,0,56,0.14)] sm:p-7 2xl:p-9">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#ff0038]" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 bg-[#ff0038]/16 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#ff0038]/8 to-transparent" />

            <div className="relative mb-7 text-center">
              <Link to="/" className="hidden items-center justify-center gap-2 text-2xl font-black text-white xl:inline-flex">
                <span className="text-3xl leading-none text-[#ff0038]">A</span>kibaCore
              </Link>
              <h2 className="text-2xl font-black text-white sm:text-3xl xl:mt-5">Back to AkibaCore</h2>
              <p className="mt-2 text-sm font-semibold text-zinc-400">{contextCopy}</p>
            </div>

            <div className="relative mb-6 grid grid-cols-3 gap-2">
              {benefitBadges.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="min-h-[66px] bg-black/45 px-2 py-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_3px_0_#ff0038] sm:min-h-[72px]">
                    <Icon className="mx-auto h-5 w-5 text-[#ff0038]" />
                    <div className="mt-2 text-[10px] font-black uppercase leading-tight tracking-wide text-zinc-400 sm:text-[11px]">{item.label}</div>
                  </div>
                );
              })}
            </div>

            <form className="relative space-y-3.5 sm:space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">
                  Email or username
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="kaito@example.com"
                  autoComplete="username"
                  required
                  className="h-12 w-full bg-[#e8eefc] px-4 text-sm font-semibold text-black placeholder-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,0,56,0.22)] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff0038]"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full bg-[#e8eefc] px-4 pr-12 text-sm font-semibold text-black placeholder-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,0,56,0.22)] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff0038]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors hover:bg-black/5 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#ff0038]"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-left">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                  <input type="checkbox" className="text-[#ff0038] focus:ring-[#ff0038] focus:ring-offset-0" />
                  Remember me
                </label>
                <button type="button" className="shrink-0 text-sm font-bold text-[#ff315a] transition-colors hover:text-white">
                  Forgot password?
                </button>
              </div>

              <div className="pt-3">
                {error && (
                  <p className="mb-3 bg-[#ff0038]/12 px-3 py-2 text-sm font-semibold text-[#ff8aa0] shadow-[inset_4px_0_0_#ff0038]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#ff0038] px-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_32px_rgba(255,0,56,0.3),5px_5px_0_0_rgba(0,0,0,0.72)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff315a] hover:shadow-[0_18px_38px_rgba(255,0,56,0.38),2px_2px_0_0_rgba(0,0,0,0.9)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LockKeyhole className="h-4 w-4" />
                  {submitting ? "Entering..." : "Enter AkibaCore"}
                </button>
              </div>
            </form>

            <div className="relative mt-7">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="h-px w-full bg-zinc-700/60" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#101116] px-4 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-5 flex justify-center gap-4">
                {["Google", "Discord", "GitHub"].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => showComingSoon(provider)}
                    className="flex h-11 w-11 items-center justify-center bg-black/35 text-sm font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-[#ff0038]"
                    aria-label={`${provider} login coming soon`}
                  >
                    {provider === "Google" ? "G" : provider === "Discord" ? "D" : "GH"}
                  </button>
                ))}
              </div>
              {socialNotice && <p className="mt-3 text-center text-xs font-semibold text-zinc-500">{socialNotice}</p>}

              <div className="mt-7 flex flex-col items-center gap-3 text-center text-sm text-zinc-400">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="font-bold text-[#ff315a] transition-colors hover:text-white">
                    Sign up
                  </Link>
                </p>
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }} className="w-full">
                  <Link
                    to="/shop"
                    className="group flex h-12 w-full items-center justify-center gap-2 bg-white text-xs font-black uppercase tracking-widest text-black shadow-[5px_5px_0_0_#ff0038] transition-transform hover:-translate-y-0.5 hover:bg-[#ff0038] hover:text-white hover:shadow-[2px_2px_0_0_rgba(255,255,255,0.9)]"
                  >
                    <Heart className="h-4 w-4 text-[#ff0038] transition-colors group-hover:text-white" />
                    Browse shop without login
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
