'use strict';

const { generarDatosIniciales } = require('../../app/repos/memoria/datos-iniciales');

// Deben coincidir con citas_backend/docs/BCK_DEFINICION.md §7 (05_datos_iniciales.sql).
describe('Datos iniciales de web_1', () => {
  const datos = generarDatosIniciales();

  test('1 sitio, 1 evento, 3 zonas, 120 asientos, 120 funciones y 360 precios', () => {
    expect(datos.sitios).toHaveLength(1);
    expect(datos.eventos).toHaveLength(1);
    expect(datos.zonas).toHaveLength(3);
    expect(datos.asientos).toHaveLength(120);
    expect(datos.funciones).toHaveLength(120);
    expect(datos.precios).toHaveLength(360);
  });

  test('zonas: Preferente A–C (30), General D–I (60) y Balcón J–L (30), 10 por fila', () => {
    const porZona = (zonaId) => datos.asientos.filter((a) => a.zonaId === zonaId);
    expect(porZona('preferente')).toHaveLength(30);
    expect(porZona('general')).toHaveLength(60);
    expect(porZona('balcon')).toHaveLength(30);
    expect([...new Set(porZona('general').map((a) => a.fila))]).toEqual(['D', 'E', 'F', 'G', 'H', 'I']);
    expect(new Set(datos.asientos.map((a) => a.id)).size).toBe(120);
  });

  test('precios: $800, $500 y $300 MXN en cada función', () => {
    const precio = Object.fromEntries(['preferente', 'general', 'balcon'].map((z) => [
      z, [...new Set(datos.precios.filter((p) => p.zonaId === z).map((p) => p.precio))],
    ]));
    expect(precio).toEqual({ preferente: [800], general: [500], balcon: [300] });
    expect(datos.zonas.every((z) => z.moneda === 'MXN')).toBe(true);
  });

  test('40 días (15 en oct, 12 en nov y 13 en dic), sólo jueves, viernes y sábado', () => {
    const dias = [...new Set(datos.funciones.map((f) => f.id.slice(4, 14)))];
    expect(dias).toHaveLength(40);
    const porMes = (mes) => dias.filter((d) => d.startsWith(`2026-${mes}`)).length;
    expect([porMes('10'), porMes('11'), porMes('12')]).toEqual([15, 12, 13]);
    for (const dia of dias) {
      expect([4, 5, 6]).toContain(new Date(`${dia}T12:00:00Z`).getUTCDay());
    }
    expect(dias).toEqual(expect.arrayContaining(['2026-12-24', '2026-12-25', '2026-12-31']));
  });

  test('horarios 15:00, 19:00 y 21:00 de CDMX guardados en UTC (UTC−6)', () => {
    const delDia = datos.funciones.filter((f) => f.id.startsWith('fun-2026-10-01-'));
    expect(delDia.map((f) => [f.id, f.inicio.toISOString()])).toEqual([
      ['fun-2026-10-01-1500', '2026-10-01T21:00:00.000Z'],
      ['fun-2026-10-01-1900', '2026-10-02T01:00:00.000Z'],
      ['fun-2026-10-01-2100', '2026-10-02T03:00:00.000Z'],
    ]);
    const ultima = datos.funciones[datos.funciones.length - 1];
    expect([ultima.id, ultima.inicio.toISOString()]).toEqual(['fun-2026-12-31-2100', '2027-01-01T03:00:00.000Z']);
  });

  test('cada llamada devuelve copias independientes', () => {
    const otra = generarDatosIniciales();
    otra.asientos[0].zonaId = 'cambiada';
    expect(generarDatosIniciales().asientos[0].zonaId).toBe('preferente');
  });
});
