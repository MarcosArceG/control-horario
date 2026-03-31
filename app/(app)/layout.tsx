import { AppHeader } from "@/components/app-header";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/90 via-slate-50 to-slate-100/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <AppHeader />
      <main className="mx-auto min-w-0 max-w-5xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
