'use strict';

const {
  generarDatosIniciales,
  generarDatosWeb1,
  generarDatosWeb2,
} = require('../../app/repos/memoria/datos-iniciales');

// Deben coincidir con citas_backend/docs/BCK_DEFINICION.md §7 (05_datos_iniciales.sql).
describe('Datos iniciales de web_1', () => {
  const datos = generarDatosWeb1();

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
    const otra = generarDatosWeb1();
    otra.asientos[0].zonaId = 'cambiada';
    expect(generarDatosWeb1().asientos[0].zonaId).toBe('preferente');
  });
});

// Deben coincidir con la «Semilla de datos acordada» del contrato (openspec impl-service).
describe('Datos iniciales de web_2', () => {
  const datos = generarDatosWeb2();

  test('1 sitio sin cuenta, 1 evento, 10 salas, 800 asientos, 900 funciones y 900 precios', () => {
    expect(datos.sitios).toEqual([{ id: 'web_2', nombre: 'Cineclub', requiereComprador: false }]);
    expect(datos.eventos).toEqual([
      expect.objectContaining({ id: 'evt-spiderman', sitio: 'web_2', nombre: 'Spider-Man' }),
    ]);
    expect(datos.zonas).toHaveLength(10);
    expect(datos.asientos).toHaveLength(800);
    expect(datos.funciones).toHaveLength(900);
    expect(datos.precios).toHaveLength(900);
  });

  test('salas «Sala 1» a «Sala 10» con capacidad 80: filas A–H, números 1–10', () => {
    expect(datos.zonas.map((z) => z.nombre)).toEqual(
      Array.from({ length: 10 }, (_, i) => `Sala ${i + 1}`)
    );
    expect(datos.zonas.every((z) => z.capacidad === 80 && z.moneda === 'MXN' && z.sitio === 'web_2')).toBe(true);
    for (const zona of datos.zonas) {
      const asientos = datos.asientos.filter((a) => a.zonaId === zona.id);
      expect(asientos).toHaveLength(80);
      expect([...new Set(asientos.map((a) => a.fila))]).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    }
    expect(new Set(datos.asientos.map((a) => a.id)).size).toBe(800);
    expect(datos.asientos.find((a) => a.id === 'sala-3-A7')).toMatchObject({
      zonaId: 'sala-3', fila: 'A', numero: 7, etiqueta: 'A7',
    });
  });

  test('30 funciones por día durante 30 días (19 nov al 18 dic 2026)', () => {
    const porDia = {};
    for (const f of datos.funciones) {
      const dia = f.id.slice(4, 14);
      porDia[dia] = (porDia[dia] || 0) + 1;
    }
    const dias = Object.keys(porDia).sort();
    expect(dias).toHaveLength(30);
    expect([dias[0], dias[dias.length - 1]]).toEqual(['2026-11-19', '2026-12-18']);
    expect(Object.values(porDia).every((n) => n === 30)).toBe(true);
  });

  test('salas 1–5 en 2D ($100) a las 13:00, 16:00 y 20:00; salas 6–10 en 3D ($150) a las 12:30, 15:30 y 18:30', () => {
    const delDia = (sala) => datos.funciones
      .filter((f) => f.id.startsWith('fun-2026-11-19-') && f.zonaId === sala)
      .map((f) => [f.formato, f.inicio.toISOString()]);
    expect(delDia('sala-1')).toEqual([
      ['2D', '2026-11-19T19:00:00.000Z'],
      ['2D', '2026-11-19T22:00:00.000Z'],
      ['2D', '2026-11-20T02:00:00.000Z'],
    ]);
    expect(delDia('sala-6')).toEqual([
      ['3D', '2026-11-19T18:30:00.000Z'],
      ['3D', '2026-11-19T21:30:00.000Z'],
      ['3D', '2026-11-20T00:30:00.000Z'],
    ]);
    const precio = new Map(datos.precios.map((p) => [p.funcionId, p]));
    for (const f of datos.funciones) {
      const numeroSala = Number(f.zonaId.split('-')[1]);
      expect(f.formato).toBe(numeroSala <= 5 ? '2D' : '3D');
      expect(precio.get(f.id)).toEqual({ funcionId: f.id, zonaId: f.zonaId, precio: f.formato === '2D' ? 100 : 150 });
    }
  });

  test('idioma y clasificación «Por confirmar» y duración de 120 minutos', () => {
    expect(datos.funciones.every((f) =>
      f.idioma === 'Por confirmar' && f.clasificacion === 'Por confirmar' && f.duracionMinutos === 120
    )).toBe(true);
  });

  test('no hay dos funciones iguales en la misma sala y hora', () => {
    expect(new Set(datos.funciones.map((f) => f.id)).size).toBe(900);
    expect(new Set(datos.funciones.map((f) => `${f.zonaId}|${f.inicio.toISOString()}`)).size).toBe(900);
  });
});

describe('Datos iniciales completos', () => {
  test('juntan web_1 y web_2 sin identificadores repetidos', () => {
    const datos = generarDatosIniciales();
    expect(datos.sitios.map((s) => [s.id, s.requiereComprador])).toEqual([['web_1', true], ['web_2', false]]);
    expect(datos.funciones).toHaveLength(120 + 900);
    expect(datos.asientos).toHaveLength(120 + 800);
    expect(datos.precios).toHaveLength(360 + 900);
    for (const lista of ['sitios', 'eventos', 'zonas', 'asientos', 'funciones']) {
      expect(new Set(datos[lista].map((x) => x.id)).size).toBe(datos[lista].length);
    }
  });
});
