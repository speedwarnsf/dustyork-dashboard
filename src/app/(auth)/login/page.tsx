import { signIn, signUp } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-8 shadow-[0_0_40px_rgba(123,220,255,0.08)]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
            D's Command Center
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Sign in to your dashboard
          </h1>
          <p className="mt-2 text-sm text-[#8b8b8b]">
            Secure Supabase authentication for your private project hub.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}
        <form action={signIn} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3 text-sm text-white placeholder:text-[#555]"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3 text-sm text-white placeholder:text-[#555]"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#7bdcff] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
          >
            Sign In
          </button>
        </form>
        <form action={signUp} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-2xl border border-[#1c1c1c] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
