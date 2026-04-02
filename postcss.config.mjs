import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * `base` fija la raíz de escaneo de clases. Sin esto, Tailwind usa el cwd del
 * proceso; en dev con otro cwd los estilos pueden “desaparecer”.
 * Next.js espera plugins como objeto { nombrePlugin: opciones }.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.resolve(__dirname),
    },
  },
};

export default config;
