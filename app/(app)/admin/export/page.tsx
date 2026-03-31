import { CsvExportForm } from "@/components/csv-export-form";
import { getAdminUsers } from "@/lib/actions";

export default async function AdminExportPage() {
  const users = await getAdminUsers();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Exportación de horas trabajadas
      </h2>
      <div className="mt-4">
        <CsvExportForm
          users={users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
          }))}
        />
      </div>
    </div>
  );
}
