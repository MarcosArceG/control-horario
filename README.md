# Control Horario

Aplicación de control horario con Next.js (App Router), PostgreSQL, Prisma y acceso por correo y contraseña. Roles: **SUPERADMIN** y **USER**. El tiempo trabajado se **calcula a partir de eventos** (`CLOCK_IN`, `CLOCK_OUT`; en datos antiguos pueden existir `BREAK_*`); no se guarda como total acumulado. Los **eventos son solo altas**; los cambios pasan por **solicitudes de corrección** revisadas por administradores. El **registro de auditoría** guarda acciones de seguridad y datos.

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Puesta en marcha

1. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Configura `DATABASE_URL`, `AUTH_SECRET` (por ejemplo `openssl rand -base64 32`) y `AUTH_URL` (por ejemplo `http://localhost:3000`).

2. Instala dependencias y aplica el esquema:

   ```bash
   npm install
   npx prisma db push
   npm run db:seed
   ```

3. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Inicia sesión con el superadministrador creado por el seed:

   - Correo: `admin@example.com`
   - Contraseña: `ChangeMe123!`

   En producción cambia esta contraseña actualizando el hash en la base de datos o creando otro administrador y eliminando la cuenta de seed.

## Producción

```bash
npm run build
npm start
```

En CI/CD puedes usar `prisma migrate deploy` si prefieres migraciones en lugar de `db push`.

## Exportación de horas

Los superadministradores pueden descargar un **archivo de valores separados por comas** con las horas trabajadas por usuario y día natural en UTC (rango de fechas) desde **Administración → Exportar horas**. Los días usan límites UTC; si necesitas zona horaria local, habría que adaptar la lógica de cálculo por día.
