import { AdminSubnav } from "@/components/admin-subnav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Administración
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona usuarios, vacaciones, revisa correcciones y exporta informes.
        </p>
      </div>
      <AdminSubnav />
      {children}
    </div>
  );
}
