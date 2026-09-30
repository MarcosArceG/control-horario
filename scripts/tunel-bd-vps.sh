#!/bin/bash
# Túnel SSH a la BD de PRODUCCIÓN (fichaje-db, Postgres en Coolify, sin puerto público).
# Queda en localhost:${1:-5433} mientras la ventana esté abierta. Ctrl+C para cerrarlo.
# Datos de conexión: .env.vps (local, no se sube a git). Ver DESPLIEGUE-VPS.md.
set -euo pipefail
PUERTO="${1:-5433}"
IP=$(ssh ubuntu@51.89.150.239 "sudo docker inspect -f '{{.NetworkSettings.Networks.coolify.IPAddress}}' vhlrtes9y1ddnfnsvpn6gg4q")
echo "BD de PRODUCCIÓN (fichaje-db) en localhost:$PUERTO  (Ctrl+C para cerrar)"
exec ssh -N -o ExitOnForwardFailure=yes -L "$PUERTO:$IP:5432" ubuntu@51.89.150.239
