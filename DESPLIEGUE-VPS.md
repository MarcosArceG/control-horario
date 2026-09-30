# Despliegue en el VPS (Coolify)

Desde septiembre de 2026 **producción está en el VPS de OVH, no en Vercel ni en Neon.**

| | |
|---|---|
| URL | https://triclock.gestiondelamianto.com |
| Panel | https://coolify.gestiondelamianto.com → proyecto `narciso` → `production` → **fichaje** |
| Servidor | `ssh ubuntu@51.89.150.239` (solo con la clave del Mac de Marcos) |
| Base de datos | Postgres 17 en Coolify: `fichaje-db` (contenedor `vhlrtes9y1ddnfnsvpn6gg4q`), **sin puerto público** |
| Build | Nixpacks (Node 22), `npm run build` |

## Desplegar un cambio

**`git push origin main` y listo.** GitHub avisa a Coolify por webhook y en 2-3 minutos está en
producción. Si el build falla, Coolify deja funcionando la versión anterior (no hay caída).

- Ver cómo va: panel → fichaje → **Deployments** (log completo del build).
- Otras ramas no despliegan; solo `main`.
- Forzar un redespliegue sin cambios de código: panel → fichaje → **Redeploy**.

Comprobar después:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://triclock.gestiondelamianto.com/login   # 200
```

## ⚠️ Cambios en `prisma/schema.prisma`

El `.env` local **sigue apuntando a Neon, que ya NO es producción** (quedó congelada en la
migración y se dará de baja). Un `npx prisma db push` con el `.env` de siempre no cambia nada
en producción.

La BD de producción solo es accesible por túnel SSH. **Aplicar el esquema ANTES de hacer push
del código** que lo usa:

```bash
# Terminal 1: abre el túnel (deja la ventana abierta; Ctrl+C para cerrarlo)
./scripts/tunel-bd-vps.sh

# Terminal 2: .env.vps (local, no se sube a git) apunta a localhost:5433
set -a; source .env.vps; set +a
npx prisma db push          # revisar lo que propone antes de aceptar si avisa de pérdida de datos
```

Luego `git push origin main`. Este proyecto usa `db push` (no hay historial de migraciones).
Si `.env.vps` no existe, pedir los datos de conexión a Marcos (están en Coolify → fichaje-db).

El mismo túnel sirve para consultar datos de producción (psql, Prisma Studio con
`npx prisma studio` tras cargar `.env.vps`, scripts…). **Cuidado: es la BD real.**

## Variables de entorno

Se gestionan en **Coolify → fichaje → Environment Variables** (ya no en Vercel). Tras cambiar
una variable hay que **Redeploy** (las `NEXT_PUBLIC_*` se incrustan en el build).

Actuales: `DATABASE_URL` (BD interna del VPS), `AUTH_SECRET`, `AUTH_URL`, `AUTH_USER_1_*`,
`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `NEXT_PUBLIC_APP_URL`,
`NIXPACKS_NODE_VERSION=22`. Una variable nueva en el código → añadirla también en Coolify.

## Logs y problemas

- Logs de la app en vivo: panel → fichaje → **Logs**.
- Por SSH: `ssh ubuntu@51.89.150.239 'sudo docker logs --tail 100 $(sudo docker ps -q --filter name=kuulnxnof2ttkzhywo7jzexb)'`

## Volver a la versión anterior

- Rápido: panel → fichaje → **Deployments** → elegir un despliegue anterior que funcionaba → **Redeploy**.
- Definitivo: `git revert <commit>` y `git push origin main`.

Ojo: volver atrás el código **no** deshace un `prisma db push` ya aplicado.

## Backups

Automáticos cada **domingo a las 03:00**: volcado a Google Drive, Unidad Compartida
**Copy App / `vps-semanal`**, se guardan las **3 últimas** (`fichaje-AAAA-MM-DD_HHMM.dump`).
Si falla, llega un correo a Marcos. Copia a mano: `ssh ubuntu@51.89.150.239 'sudo systemctl start backup-bd-vps.service'`.
Restaurar: pedirlo en el chat de mantenimiento (repo `mantenimiento`), no improvisarlo.
