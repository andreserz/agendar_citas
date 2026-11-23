const mensajes = {
  ASIENTO_NO_DISPONIBLE: 'Una o más butacas acaban de ocuparse. Actualizamos el mapa para que elijas de nuevo.',
  RESERVA_VENCIDA: 'El tiempo para completar la compra terminó. Elige nuevamente tus butacas.',
  RESERVA_LIBERADA: 'Este apartado ya se liberó. Elige nuevamente tus butacas.',
  RESERVA_PAGADA: 'Esta reserva ya fue pagada.',
  NO_ENCONTRADO: 'No encontramos la información solicitada.',
  SOLICITUD_INVALIDA: 'Revisa la información e inténtalo de nuevo.',
};

export class ErrorApp extends Error {
  constructor(codigo, mensaje, estado = 0, detalles = {}) {
    super(mensaje || mensajes[codigo] || 'No se pudo completar la solicitud.');
    this.name = 'ErrorApp';
    this.codigo = codigo || 'ERROR_INTERNO';
    this.estado = estado;
    this.detalles = detalles || {};
  }
}

export function normalizarError(body, status = 0) {
  const error = body?.error || body || {};
  const codigo = error.codigo || 'ERROR_INTERNO';
  return new ErrorApp(codigo, mensajes[codigo] || error.mensaje, status, error.detalles);
}

export function mensajeVisible(error) {
  if (error instanceof ErrorApp) return error.message;
  if (error?.name === 'AbortError') return 'El servicio tardó demasiado en responder.';
  return 'No se pudo conectar con el servicio. Inténtalo de nuevo.';
}
