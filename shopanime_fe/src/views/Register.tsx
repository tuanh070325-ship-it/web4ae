import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

function strengthLabel(score: number) {
  if (score >= 4) return "Strong";
  if (score >= 3) return "Good";
  if (score >= 2) return "Fair";
  return "Weak";
}

function friendlyRegisterError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("already exists")) return "Username or email already exists.";
  if (normalized.includes("password")) return "Password must contain at least 6 characters.";
  if (normalized.includes("failed to fetch") || normalized.includes("internal server")) return "Register service is temporarily unavailable.";
  return message;
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const score = useMemo(() => passwordScore(password), [password]);
  const strength = strengthLabel(score);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSocialNotice(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ username, email, password, full_name: username });
      navigate(searchParams.get("redirect") || "/", { replace: true });
    } catch (err) {
      setError(friendlyRegisterError(err instanceof Error ? err.message : "Register failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const showComingSoon = (provider: string) => {
    setSocialNotice(`${provider} sign up is coming soon. Use email registration for now.`);
  };

  return (
    <div className="flex min-h-screen bg-[#111] font-sans text-zinc-300 lg:max-h-screen lg:overflow-hidden">
      <div className="relative hidden w-1/2 bg-zinc-900 lg:block">
        <img
          src="https://instagram.fhan17-1.fna.fbcdn.net/v/t51.82787-15/671155843_17869809438601053_1495102613955512497_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=109&ig_cache_key=Mzg3NzUxMDc3NjI3NDMzNjA3Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMjE2MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=xgFVGhWJs-wQ7kNvwE1lr5-&_nc_oc=AdoK2gTcE6gXXLcfcBGLq48mYxVpp54D9IupHhB2SsXaz-PfutLT9-ybA-lUqI0qPzs&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fhan17-1.fna&_nc_gid=wUXo67V89YBSod55yeE-zA&_nc_ss=7a22e&oh=00_Af73oQSyRT3_KhFms1hWr4Gqw9LJ9wYBY-6bvPxkLh2GGA&oe=6A07D838"
          alt="Characters"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="text-sm text-zinc-500">AkibaCore - Embrace Your Dark Side</p>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center overflow-y-auto bg-[#0b0b0d] p-5 lg:w-1/2 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_16%,rgba(255,0,56,0.2),transparent_30%),linear-gradient(180deg,rgba(255,0,56,0.08),transparent_44%)]" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-3xl font-black text-white">
              <span className="text-[#ff0038]">A</span>kibaCore
            </Link>
            <h1 className="mt-4 text-3xl font-black text-white">Create your shelf</h1>
            <p className="mt-2 text-sm font-semibold text-zinc-500">Join manga drops, wishlist sync, and member-only deals.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="group">
              <label htmlFor="username" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition-colors group-focus-within:text-[#ff315a]">
                <UserRound className="h-4 w-4" />
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your reader name"
                className="h-12 w-full bg-[#18191d] px-4 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),4px_4px_0_0_rgba(255,0,56,0)] transition-all focus:bg-[#101116] focus:outline-none focus:ring-2 focus:ring-[#ff0038] focus:shadow-[4px_4px_0_0_rgba(255,0,56,0.72)]"
                autoComplete="username"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="email" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition-colors group-focus-within:text-[#ff315a]">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full bg-[#18191d] px-4 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),4px_4px_0_0_rgba(255,0,56,0)] transition-all focus:bg-[#101116] focus:outline-none focus:ring-2 focus:ring-[#ff0038] focus:shadow-[4px_4px_0_0_rgba(255,0,56,0.72)]"
                autoComplete="email"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition-colors group-focus-within:text-[#ff315a]">
                <LockKeyhole className="h-4 w-4" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Build a secure password"
                  className="h-12 w-full bg-[#18191d] px-4 pr-12 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),4px_4px_0_0_rgba(255,0,56,0)] transition-all focus:bg-[#101116] focus:outline-none focus:ring-2 focus:ring-[#ff0038] focus:shadow-[4px_4px_0_0_rgba(255,0,56,0.72)]"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <motion.div
                    key={level}
                    animate={{ opacity: score >= level ? 1 : 0.28 }}
                    className={`h-1.5 flex-1 ${score >= level ? "bg-[#ff0038]" : "bg-zinc-800"}`}
                  />
                ))}
              </div>
              <p className={`mt-2 text-xs font-semibold ${score >= 3 ? "text-[#ff8aa0]" : "text-red-500"}`}>Strength: {strength}</p>
            </div>

            <div className="group pt-1">
              <label htmlFor="confirmPassword" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition-colors group-focus-within:text-[#ff315a]">
                <LockKeyhole className="h-4 w-4" />
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className="h-12 w-full bg-[#18191d] px-4 pr-12 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),4px_4px_0_0_rgba(255,0,56,0)] transition-all focus:bg-[#101116] focus:outline-none focus:ring-2 focus:ring-[#ff0038] focus:shadow-[4px_4px_0_0_rgba(255,0,56,0.72)]"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors hover:text-white"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              {error && <p className="mb-3 bg-[#ff0038]/12 px-3 py-2 text-sm font-semibold text-[#ff8aa0] shadow-[inset_4px_0_0_#ff0038]">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 bg-[#ff0038] px-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_32px_rgba(255,0,56,0.3),5px_5px_0_0_rgba(0,0,0,0.72)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff315a] hover:shadow-[0_18px_38px_rgba(255,0,56,0.38),2px_2px_0_0_rgba(0,0,0,0.9)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? "Creating shelf..." : "Create account"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="h-px w-full bg-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0b0b0d] px-4 text-zinc-500">or sign up with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              {["Google", "Discord", "GitHub"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => showComingSoon(provider)}
                  className="flex h-11 w-11 items-center justify-center bg-[#18191d] text-sm font-black text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-[#ff0038]"
                  aria-label={`${provider} sign up coming soon`}
                >
                  {provider === "Google" ? "G" : provider === "Discord" ? "D" : "GH"}
                </button>
              ))}
            </div>
            {socialNotice && <p className="mt-3 text-center text-xs font-semibold text-zinc-500">{socialNotice}</p>}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 text-center text-sm text-zinc-500">
            <p>
              Already a member?{" "}
              <Link to="/login" className="font-bold text-zinc-200 underline decoration-[#ff0038] underline-offset-4 transition-colors hover:text-white">
                Log in
              </Link>
            </p>
            <Link to="/shop" className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition-colors hover:text-white">
              Browse manga first
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
