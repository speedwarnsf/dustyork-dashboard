import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";
import CommandPalette from "@/components/CommandPalette";
import Header from "@/components/Header";
import MobileLayout from "@/components/MobileLayout";
import { Toaster } from "react-hot-toast";

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
    <>
      {/* Global Components */}
      <CommandPalette />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            color: '#f5f5f5',
            border: '1px solid #1c1c1c',
            borderRadius: '12px',
          },
          success: {
            style: {
              borderColor: '#d2ff5a',
            },
          },
          error: {
            style: {
              borderColor: '#ff4444',
            },
          },
        }}
      />
      
      <MobileLayout>
        <div className="min-h-screen bg-black text-white">
          {/* Desktop Header */}
          <header className="sticky top-0 z-40 border-b border-[#1c1c1c] glass-strong hidden md:block">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
              <Header />
              
              <div className="flex items-center gap-4">
                {/* User info */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{user.email?.split("@")[0]}</p>
                  <p className="text-xs text-[#666]">{user.email}</p>
                </div>
                
                {/* Sign out */}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-lg border border-[#1c1c1c] px-3 py-2 text-xs text-[#8b8b8b] transition hover:border-red-500/50 hover:text-red-400"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="pb-16 md:pb-8">
            {children}
          </main>
          
          {/* Desktop Footer */}
          <footer className="border-t border-[#1c1c1c] py-6 hidden md:block">
            <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-xs text-[#555]">
              <p>Built with 🌙 by Io</p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/speedwarnsf" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-[#7bdcff] transition"
                >
                  GitHub
                </a>
                <a 
                  href="https://dyorkmusic.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-[#7bdcff] transition"
                >
                  D_York Music
                </a>
              </div>
            </div>
          </footer>
        </div>
      </MobileLayout>
    </>
  );
}
