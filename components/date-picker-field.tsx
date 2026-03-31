"use client";

const inputClassName =
  "date-picker-input mt-1 w-full min-h-11 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base tabular-nums text-slate-900 shadow-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 [color-scheme:light] dark:[color-scheme:dark]";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
};

/**
 * Campo de fecha con el calendario nativo del navegador (móvil y escritorio).
 * `showPicker()` abre el panel explícitamente cuando el navegador lo permite.
 */
export function DatePickerField({ label, value, onChange, required, id }: Props) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      <input
        id={id}
        type="date"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          const el = e.currentTarget;
          if (typeof el.showPicker === "function") {
            try {
              el.showPicker();
            } catch {
              /* p. ej. Safari sin gesto válido */
            }
          }
        }}
        className={inputClassName}
        lang="es"
        autoComplete="off"
      />
    </label>
  );
}
