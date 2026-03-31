/** Etiquetas en español para valores mostrados en la interfaz */

export function etiquetaTipoEvento(t: string): string {
  switch (t) {
    case "CLOCK_IN":
      return "Entrada";
    case "CLOCK_OUT":
      return "Salida";
    case "BREAK_START":
      return "Inicio de pausa";
    case "BREAK_END":
      return "Fin de pausa";
    default:
      return t;
  }
}

export function etiquetaEstadoCorreccion(s: string): string {
  switch (s) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
    default:
      return s;
  }
}

export function etiquetaRol(r: string): string {
  switch (r) {
    case "USER":
      return "Usuario";
    case "SUPERADMIN":
      return "Superadministrador";
    default:
      return r;
  }
}

/** Acciones guardadas en auditoría (códigos internos → texto en español). */
export function etiquetaAccionAuditoria(action: string): string {
  switch (action) {
    case "AUTH_LOGIN":
      return "Inicio de sesión";
    case "TIME_EVENT_CREATE":
      return "Registro de marcaje";
    case "TIME_CORRECTION_CREATE":
      return "Solicitud de corrección";
    case "TIME_CORRECTION_APPROVE":
      return "Corrección aprobada";
    case "TIME_CORRECTION_REJECT":
      return "Corrección rechazada";
    case "USER_CREATE":
      return "Alta de usuario";
    case "USER_DELETE":
      return "Usuario eliminado";
    case "USER_PASSWORD_RESET":
      return "Contraseña restablecida";
    case "CSV_EXPORT_WORKED_HOURS":
      return "Exportación de horas trabajadas";
    case "VACATION_ENTITLEMENT_SET":
      return "Tope de vacaciones actualizado";
    default:
      return action;
  }
}

export function etiquetaTipoEntidadAuditoria(tipo: string): string {
  switch (tipo) {
    case "User":
      return "Usuario";
    case "TimeEvent":
      return "Evento de marcaje";
    case "TimeCorrection":
      return "Corrección horaria";
    case "Export":
      return "Exportación";
    default:
      return tipo;
  }
}
