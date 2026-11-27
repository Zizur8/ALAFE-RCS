# GEMINI.md — Contexto y Reglas del Proyecto ALAFE

## 1. Descripción del Proyecto
- **Empresa desarrolladora:** SendaVaz
- **Producto:** ALAFE ("Donde sea y cuando sea.")
- **Propósito:** Plataforma web (enfoque *mobile-first*) para digitalizar la gestión de agendas de eventos para albercas, salones, fincas y espacios similares, sustituyendo el cuaderno físico.

## 2. Alcance Activo vs. Futuro
### En alcance (Fase 1 — Core del sistema)
1. **Homepage / Bienvenida**
2. **Login y Autenticación (JWT)**
3. **Main App (Agenda / Calendario + Formulario de Eventos)**
4. **Clientes**
5. **Movimientos (Anticipos, Abonos, Devoluciones)**
6. **Reportes (Filtros e ingresos mensuales)**
7. **Usuarios y Permisos**
8. **Configuración**

### Fuera de alcance (Fase 2 — NO implementar salvo indicación explícita)
- Mapa de calor por colonia, módulo de inventarios/mantenimiento, terminales POS o pasarelas de pago, chat integrado con Meta Business/WhatsApp, facturación CFDI y dashboards avanzados de BI.

## 3. Stack Tecnológico y Arquitectura
*(Verifica siempre los archivos actuales del repositorio antes de asumir rutas o librerías).*
- **Frontend:** React + TypeScript + Vite (verificar carpetas en `frontend/` o `src/`).
- **Backend:** ASP.NET Core Web API (.NET 10) + Entity Framework Core / Dapper.
- **Base de datos:** Microsoft SQL Server.
- **Autenticación:** JWT con control de acceso basado en roles y permisos.
- **Fechas y zonas horarias:** Almacenar fechas/horas en **UTC** en backend/BD y convertir a la zona horaria local en la interfaz.

## 4. Reglas de Negocio Invariables
### Calendario y Eventos
- **Paleta funcional del calendario:**
  - Naranja: fecha con evento registrado (ocupada).
  - Morado: fecha seleccionada por el usuario.
  - Azul: fecha actual (hoy).
- Duración mínima de un evento: **mayor a 1 hora**.
- **No se permiten empalmes** de horario dentro de la misma agenda.
- `Costo > 0` (salvo eventos gratuitos/especiales explícitamente marcados).
- Campos especiales soportados: *Ocupa dos días*, *Decorar* (requiere capturar horario de decoración), *Especial*, *Horas extras* (con costo propio por hora) y *Notas*.
- El cliente es opcional al agendar, pero si se asocia debe cumplir con sus datos obligatorios.
- **Restricción de borrado:** un evento **NO** se puede eliminar si tiene movimientos monetarios registrados.
- Mostrar trazabilidad del último movimiento/acción (quién creó, modificó o registró).

### Clientes
- Un cliente pertenece a un propietario y puede compartirse entre agendas del mismo propietario.
- Búsqueda por nombre mostrando teléfono y dirección/colonia para evitar homónimos.
- Permite marcar clientes como **problemáticos** y manejar un cliente genérico *"especial"*.
- **Restricción de borrado:** un cliente **NO** se puede eliminar si tiene eventos o movimientos financieros asociados.

### Movimientos Monetarios
- Tipos de operación: **Anticipo**, **Abono** y **Devolución**.
- Soporte de moneda (`MXN`, `USD`, `EUR`), tasa de cambio y monto equivalente.
- Fórmulas:
  - `Costo Total = Costo base + (Cantidad de horas extras × Costo hora extra)`
  - `Saldo = Costo Total - Movimientos` (cuando el saldo llega a 0, el evento se marca como **Liquidado**).

### Roles y Permisos
- **Administrador:** control total del sistema y gestión de usuarios/permisos.
- **Usuario parcial:** acciones limitadas y configurables por módulo/acción por el administrador.
- **Observador:** solo lectura para consultas rápidas.

## 5. Lineamientos de Diseño UX/UI (Obligatorios)
- **Estilo visual:** limpio, minimalista y **100% plano (flat design)**. **NO usar degradados** ni sombras pesadas.
- **Iconografía:** evitar iconos de flecha decorativos innecesarios (especialmente en pantallas de bienvenida o tarjetas).
- **Jerarquía de acciones:** mantener **una sola acción primaria clara por vista**; evitar botones duplicados para la misma función (ej. no repetir botones de "Crear evento" en múltiples zonas a la vez).
- **Responsive (Desktop-First):** priorizar usabilidad en computadora de escritorio.
- **Animaciones:** únicamente microinteracciones y animaciones de entrada sutiles.
- **UX alineada al negocio:** reflejar restricciones directamente en la UI (botones deshabilitados con tooltip claro cuando no se puede borrar un registro, validaciones visibles antes de enviar y estados vacíos útiles).
- **Reutilización:** centralizar componentes compartidos (encabezados de módulo, buscadores, filtros, badges, modales/drawers) y mantener los datos *mock* desacoplados en archivos separados cuando se trabaje solo en frontend.

## 6. Convenciones de Código y Calidad
- **Frontend:** respetar TypeScript estricto (sin `any` innecesarios ni importaciones rotas). Antes de dar por terminada cualquier tarea de frontend, ejecutar y validar `tsc -b && vite build`.
- **Backend / SQL Server:** priorizar consultas eficientes, evitar problemas N+1, evitar joins innecesarios y cuidar el rendimiento de índices y ejecuciones en SQL Server.
- **Separación de capas:** si la instrucción pide trabajar "solo frontend", **NO** modificar archivos del backend ni alterar contratos existentes sin confirmación.

## 7. Flujo de Trabajo y Git
- **Planificar primero:** ante cualquier tarea nueva o cambio grande, presentar primero un plan breve (componentes, archivos a crear/modificar y flujos) y esperar aprobación antes de escribir código.
- **Un módulo a la vez:** implementar de forma incremental y detenerse al finalizar cada módulo con un resumen de archivos tocados y pasos para probarlo.
- **Ramas:** respetar el flujo de ramas (`feature/*` desde `develop`). No hacer commits directos ni push forzado a `main` o `develop`.
- **Idioma:** responder, comentar decisiones de negocio y redactar toda la interfaz de usuario en **español**.
