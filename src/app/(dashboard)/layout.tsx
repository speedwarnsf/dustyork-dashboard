import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-[#1c1c1c] bg-black/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
              Command Center v2
            </p>
            <h1 className="text-xl font-semibold">Project Dashboard</h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-[#1c1c1c] px-4 py-2 text-xs uppercase tracking-[0.3em] transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
