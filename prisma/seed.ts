import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Los superadministradores se definen en SUPERADMIN_ACCOUNTS (ver .env.example).
 * Este seed puede usarse para datos de prueba de usuarios normales si lo amplias.
 */
async function main() {
  console.log(
    "Seed: no se crean usuarios por defecto. Configura SUPERADMIN_ACCOUNTS en .env para administradores.",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
