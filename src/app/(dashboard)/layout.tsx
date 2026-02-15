import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import Header from "@/components/Header";
import DarkModeToggle from "@/components/DarkModeToggle";
import MobileLayout from "@/components/MobileLayout";
import { Toaster } from "react-hot-toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projectsForNav } = await supabase
    .from("projects")
    .select("id, name")
    .order("updated_at", { ascending: false });

  return (
    <>
      <CommandPalette />
      <KeyboardShortcuts projects={(projectsForNav || []).map(p => ({ id: p.id, name: p.name }))} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#080808',
            color: '#e8e8e8',
            border: '1px solid #1a1a1a',
            borderRadius: '0',
            fontSize: '13px',
          },
          success: { style: { borderColor: '#d2ff5a' } },
          error: { style: { borderColor: '#ff4444' } },
        }}
      />

      <MobileLayout>
        <div className="min-h-screen bg-black text-[#e8e8e8] relative">
          {/* Desktop Header */}
          <header className="sticky top-0 z-40 border-b border-[#1a1a1a] bg-black/95 backdrop-blur-sm hidden md:block">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
              <Header />
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <div id="profile" className="hidden sm:block text-right">
                  <p className="text-xs text-[#555] font-mono">{user.email}</p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="border border-[#1a1a1a] px-3 py-1.5 text-[11px] text-[#444] hover:border-red-500/30 hover:text-red-400 transition"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </header>

          {/* Main */}
          <main id="main-content" className="pb-20 md:pb-8" role="main">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#1a1a1a] py-5 hidden md:block">
            <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-[11px] text-[#333] font-mono">
              <p>Built by Io</p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/speedwarnsf" target="_blank" rel="noreferrer" className="hover:text-[#555] transition">GitHub</a>
                <a href="/changelog" className="hover:text-[#555] transition">What&apos;s New</a>
                <a href="https://dyorkmusic.com" target="_blank" rel="noreferrer" className="hover:text-[#555] transition">D York Music</a>
              </div>
            </div>
          </footer>
        </div>
      </MobileLayout>
    </>
  );
}
