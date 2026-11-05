# BCK — Diagrama entidad-relación

Etapa: 3. Definición · Fecha: 5 nov 2026 · Responsable: A (Alfredo)
Detalle de columnas, tipos y restricciones: `docs/BCK_DEFINICION.md` §6.

Para simplificar el diagrama no se repiten las columnas `FechaRegistro` ni `Activo`, que siguen la convención de §6.

```mermaid
erDiagram
    Sitios ||--o{ Zonas : "tiene"
    Sitios ||--o{ Eventos : "publica"
    Eventos ||--o{ Funciones : "programa"
    Zonas ||--o{ Asientos : "agrupa"
    Funciones ||--o{ PreciosZonaFuncion : "define precio"
    Zonas ||--o{ PreciosZonaFuncion : "tiene precio"
    Funciones ||--o{ AsientosFuncion : "ofrece"
    Asientos ||--o{ AsientosFuncion : "se ofrece en"
    Reservas |o--o{ AsientosFuncion : "aparta o compra"
    Compradores ||--o{ Reservas : "hace"
    Sitios ||--o{ Reservas : "origina"
    Funciones ||--o{ Reservas : "para"
    EstadosReserva ||--o{ Reservas : "clasifica"
    Reservas ||--|{ ReservasAsientos : "incluye"
    Asientos ||--o{ ReservasAsientos : "reservado en"
    Reservas ||--o{ IntentosPago : "recibe"
    ResultadosPago ||--o{ IntentosPago : "clasifica"
    Reservas ||--o| Ordenes : "genera"
    Compradores ||--o{ Ordenes : "compra"
    Sitios ||--o{ Ordenes : "vende"
    Ordenes ||--|{ Boletos : "emite"
    Funciones ||--o{ Boletos : "para"
    Asientos ||--o{ Boletos : "ocupa"

    Sitios {
        INT Id PK
        VARCHAR Clave UK
        NVARCHAR Descripcion
    }
    Zonas {
        INT Id PK
        INT IdSitio FK
        NVARCHAR Descripcion
    }
    EstadosReserva {
        TINYINT Id PK
        NVARCHAR Descripcion UK
    }
    ResultadosPago {
        TINYINT Id PK
        NVARCHAR Descripcion UK
    }
    Compradores {
        INT Id PK
        NVARCHAR Nombre
        NVARCHAR Correo UK
        VARCHAR HashContrasena
    }
    Eventos {
        INT Id PK
        INT IdSitio FK
        NVARCHAR Nombre
        NVARCHAR Descripcion
    }
    Funciones {
        INT Id PK
        INT IdEvento FK
        DATETIME2 FechaHoraInicio "UTC"
    }
    Asientos {
        INT Id PK
        INT IdZona FK
        VARCHAR Fila
        SMALLINT Numero
        VARCHAR Etiqueta "calculada"
    }
    PreciosZonaFuncion {
        INT Id PK
        INT IdFuncion FK
        INT IdZona FK
        DECIMAL Precio
        CHAR Moneda
    }
    AsientosFuncion {
        INT Id PK
        INT IdFuncion FK
        INT IdAsiento FK
        BIGINT IdReservaActual FK "nulo si libre"
        DATETIME2 ExpiraEn
        BIT Vendido
    }
    Reservas {
        BIGINT Id PK
        INT IdComprador FK
        INT IdSitio FK
        INT IdFuncion FK
        TINYINT IdEstadoReserva FK
        DATETIME2 CreadaEn
        DATETIME2 ExpiraEn
        DECIMAL Total
    }
    ReservasAsientos {
        BIGINT Id PK
        BIGINT IdReserva FK
        INT IdAsiento FK
        DECIMAL PrecioTomado
    }
    IntentosPago {
        BIGINT Id PK
        BIGINT IdReserva FK
        TINYINT IdResultadoPago FK
        DATETIME2 FechaIntento
    }
    Ordenes {
        BIGINT Id PK
        VARCHAR Folio UK "calculada"
        BIGINT IdReserva FK "única"
        INT IdComprador FK
        INT IdSitio FK
        DECIMAL Total
        DATETIME2 FechaCompra
    }
    Boletos {
        BIGINT Id PK
        BIGINT IdOrden FK
        INT IdFuncion FK
        INT IdAsiento FK
        DECIMAL Precio
        CHAR Codigo UK
    }
    BitacoraErrores {
        BIGINT Id PK
        NVARCHAR Procedimiento
        INT NumeroError
        NVARCHAR Mensaje
    }
```

## Claves únicas compuestas (no se ven en el diagrama)

| Tabla | Clave única |
| --- | --- |
| `Zonas` | (`IdSitio`, `Descripcion`) |
| `Funciones` | (`IdEvento`, `FechaHoraInicio`) |
| `Asientos` | (`IdZona`, `Fila`, `Numero`) |
| `PreciosZonaFuncion` | (`IdFuncion`, `IdZona`) |
| `AsientosFuncion` | (`IdFuncion`, `IdAsiento`) |
| `ReservasAsientos` | (`IdReserva`, `IdAsiento`) |
| `Boletos` | (`IdFuncion`, `IdAsiento`), que impide vender dos veces un asiento |

`BitacoraErrores` no tiene relaciones: es sólo de uso interno.
