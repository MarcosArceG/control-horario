export function UpcomingEventsPlaceholder() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
        Próximos eventos en la empresa
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        No hay eventos programados. Esta sección se podrá enlazar con un
        calendario corporativo cuando esté disponible.
      </p>
    </section>
  );
}
