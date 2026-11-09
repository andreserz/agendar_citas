/** Error de negocio con el formato de la API (`error.codigo`, `error.mensaje`, `error.detalles`). */
export class ErrorApp extends Error {
  constructor(codigo, mensaje, status = 400, detalles = undefined) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.codigo = codigo;
    this.status = status;
    this.detalles = detalles;
  }
}

export class ErrorRed extends Error {
  constructor(mensaje = 'No se pudo conectar con el servicio.') {
    super(mensaje);
    this.name = 'ErrorRed';
    this.codigo = 'ERROR_RED';
    this.status = 0;
  }
}

export function esErrorRed(error) {
  return error instanceof ErrorRed || error?.name === 'TimeoutError' || error?.name === 'TypeError' && /fetch|network/i.test(error.message);
}

export function mensajeDeError(error) {
  if (error?.codigo === 'NO_AUTENTICADO') return 'Inicia sesión para continuar.';
  if (error?.mensaje) return error.mensaje;
  if (error?.message) return error.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export function normalizarErrorApi(cuerpo, status) {
  const detalle = cuerpo?.error;
  if (detalle?.codigo && detalle?.mensaje) {
    return new ErrorApp(detalle.codigo, detalle.mensaje, status, detalle.detalles);
  }
  return new ErrorApp('ERROR_INTERNO', 'El servicio respondió de forma inesperada.', status);
}
