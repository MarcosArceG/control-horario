# Control Horario

Aplicación de control horario con Next.js (App Router), PostgreSQL, Prisma y acceso por correo y contraseña. Roles: **SUPERADMIN** (definidos solo en la variable de entorno `SUPERADMIN_ACCOUNTS`) y **USER** (creados desde el panel de administración). El tiempo trabajado se **calcula a partir de eventos** (`CLOCK_IN`, `CLOCK_OUT`; en datos antiguos pueden existir `BREAK_*`); no se guarda como total acumulado. Los **eventos son solo altas**; los cambios pasan por **solicitudes de corrección** revisadas por administradores. Las **vacaciones** (22 días laborables al año natural) las registra el administrador; los empleados consultan lo disfrutado. El **registro de auditoría** guarda acciones de seguridad y datos.

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Puesta en marcha

1. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Configura `DATABASE_URL`, `AUTH_SECRET` (por ejemplo `openssl rand -base64 32`), `AUTH_URL` (por ejemplo `http://localhost:3000`) y **`SUPERADMIN_ACCOUNTS`**: JSON con uno o más objetos `{ "email", "password" }` (ver `.env.example`). Los superadministradores no se crean por seed ni desde el formulario de altas.

2. Instala dependencias y aplica el esquema:

   ```bash
   npm install
   npx prisma db push
   ```

   Opcional: `npm run db:seed` (actualmente solo muestra un mensaje informativo).

3. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Inicia sesión con un correo y contraseña definidos en `SUPERADMIN_ACCOUNTS`. En el primer acceso se crea el usuario en la base de datos con rol superadministrador. Los trabajadores se dan de alta desde **Administración → Usuarios** una vez dentro.

## Producción

```bash
npm run build
npm start
```

En CI/CD puedes usar `prisma migrate deploy` si prefieres migraciones en lugar de `db push`.

### Vercel

En **Project → Settings → Environment Variables** define al menos:

| Variable | Notas |
| -------- | ----- |
| `AUTH_SECRET` | Obligatorio en producción (p. ej. `openssl rand -base64 32`). Sin esto Auth.js falla. |
| `AUTH_URL` | URL pública exacta: `https://tu-proyecto.vercel.app` o tu dominio (sin barra final). |
| `DATABASE_URL` | Cadena PostgreSQL; muchos proveedores exigen `?sslmode=require`. Tras el primer deploy, ejecuta `prisma db push` o migraciones contra esa base. |
| `SUPERADMIN_ACCOUNTS` | Misma línea JSON que en local (entre comillas si hace falta en el panel). |

Opcional: `NEXT_PUBLIC_APP_URL` igual que `AUTH_URL` si usas el `id` del manifest PWA.

Si algo falla, revisa **Logs** del deployment y prueba `GET /api/health` (debe responder `{"ok":true}` sin base de datos).

## Exportación de horas

Los superadministradores pueden descargar un **archivo de valores separados por comas** con las horas trabajadas por usuario y día natural en UTC (rango de fechas) desde **Administración → Exportar horas**. Los días usan límites UTC; si necesitas zona horaria local, habría que adaptar la lógica de cálculo por día.
