# Arquitectura Frontend y Contratos Backend — Módulo de Administración (ALAFE)

**Fecha:** 2026-11-27  
**Estado:** Diagnóstico previo a la integración real de Usuarios, Roles, Permisos y RBAC en interfaz  
**Alcance:** `/frontend/src` (React + Vite + TypeScript) y contratos activos en `/backend` (ASP.NET Core .NET 10)

---

## 1. Arquitectura de Navegación y Páginas (`/frontend/src`)

### 1.1 Enrutamiento principal (`App.tsx`)
El enrutamiento con `react-router-dom` expone únicamente tres rutas activas:

| Ruta | Componente | Acceso | Función |
|---|---|---|---|
| `/` | Redirección / entrada | Público / Condicional | Punto de entrada inicial |
| `/login` | `Home.tsx` | Público | Pantalla de inicio de sesión real (sin navegación de módulos) |
| `/app` | `AgendaPage.tsx` | Protegida (`ProtectedRoute`) | Contenedor principal de toda la aplicación |

### 1.2 Navegación interna de módulos (`AgendaPage.tsx`)
Los seis módulos operativos no son rutas independientes de React Router; se conmutan mediante el estado local `activeModule` (valor inicial: `'agenda'`) a través de botones en el menú y un `switch` condicional:

- `agenda` (módulo predeterminado al ingresar a `/app`)
- `clientes`
- `movimientos`
- `reportes`
- `usuarios`
- `configuracion`

> **Nota técnica (`Layout.tsx`):** Existe un componente `Layout.tsx` con enlaces `NavLink` hacia `/`, `/clientes`, `/permisos-usuarios` y `/configuracion`, pero **no está montado en `App.tsx`** ni corresponde a la navegación activa. Debe evaluarse su eliminación o limpieza posterior para evitar confusión.

---

## 2. Estado Actual de los Módulos Inspeccionados

### 2.1 Módulo de Usuarios (`components/modules/UsersModule.tsx`)
- **Fuente de datos actual:** Estado local inicializado desde `USERS` en `mockData.ts` (sin conexión a la API).
- **Funciones maquetadas:**
  - Listado de usuarios con búsqueda por nombre o correo.
  - Filtros por estado (`Todos`, `Activos`, `Inactivos`) y por rol.
  - Diálogo para crear/editar usuario con: nombre, correo, rol (lista estática: `Administrador`, `Usuario parcial`, `Observador`), cantidad de agendas, estado y una matriz visual de permisos por módulo/acción (`Ver`, `Crear`, `Editar`, `Eliminar`).
- **Pendiente para integración real:**
  - Separar o incorporar administración independiente de **Roles y Permisos** (actualmente no existe pestaña ni modal propio para CRUD de roles).
  - Reemplazar la matriz fija de acciones por el catálogo real de permisos (`GET /api/roles/permisos`) y asignar agendas reales por ID (`AgendaIds`).

### 2.2 Componentes reutilizables (`ModuleUi.tsx`)
Expone los bloques base de diseño que deben reutilizarse para mantener consistencia visual:
- `ModuleHeader`
- `Badge`
- `SearchField`
- `FilterChip`
- `SelectLike`
- `StatCard`

### 2.3 Selector de Agendas (`AgendaPage.tsx`)
- Actualmente inicializa `agendas` con dos perfiles locales de demostración y eventos generados por `createDemoEvents`.
- **Brecha actual:** No lee `user.agendas` desde `AuthContext` y utiliza `agendas[0]` como respaldo. Si un usuario autenticado tiene `user.agendas = []`, la pantalla sigue mostrando las agendas demo en lugar de un estado vacío sin calendario.

---

## 3. Infraestructura de Sesión y Cliente HTTP

### 3.1 `AuthContext.tsx` (`AuthContextValue`)
Propiedades y métodos expuestos actualmente:
- `user`: datos cargados desde `GET /api/auth/me`
- `isAuthenticated`: estado booleano de sesión
- `isLoading`: indicador durante `initializeSession()`
- `login(correo, password, recordarme)`: inicia sesión y consulta `/api/auth/me`
- `logout(cerrarTodasLasSesiones?)`: revoca sesión y limpia estado en memoria
- `hasPermission(clave)`: consulta si el permiso existe en `user.permisos`

> **Brecha detectada:** No existe todavía un método `refreshUser()` para recargar `GET /api/auth/me` en caliente (necesario cuando el usuario edita su propio rol/permisos, agendas o cambia de plan).

### 3.2 `apiClient.ts` y manejo de errores
- Convierte respuestas HTTP no exitosas en `ApiError(statusCode, message)`.
- `parseError` extrae `message` (formato estándar de `ExceptionMiddleware`: `{ statusCode, message, traceId }`) y usa `title` como respaldo.
- **Brecha detectada:** Si ASP.NET Core devuelve un `400 Bad Request` de validación automática de modelo (`ValidationProblemDetails` con el diccionario `errors`), `parseError` actualmente descarta el detalle de `errors` y solo muestra `title` genérico.

---

## 4. Reglas de Negocio y Contratos de API (`/backend`)

### 4.1 Reglas clave de seguridad y autorización
- **Permisos basados en rol (RBAC):** `PermissionAuthorizationHandler` evalúa estrictamente los permisos asociados al rol activo del usuario. No concede bypass automático por `EsPropietario == true` ni por el nombre `"Administrador"` (el rol `Administrador` posee todos los permisos porque así se crea en el *seeder* y en el registro de propietario).
- **Reglas exclusivas de `EsPropietario`:** Se aplica en validaciones de negocio específicas (como acceso a agendas y protección del usuario titular).
- **Usuarios con cero agendas:** Aunque `AgendaIds` es propiedad requerida en los DTOs de creación y edición, `UsuarioService.ValidateAgendasAsync` normaliza `null` a lista vacía y **permite `Count == 0`**. Si se envían IDs, todos deben corresponder a agendas activas del mismo `PropietarioId`.
- **Inmutabilidad del correo en edición:** `PUT /api/usuarios/{id}` no recibe `Correo` (solo se define al crear el usuario).

---

### 4.2 Endpoints de Roles (`/api/roles`)
**Permiso requerido:** `permisos.administrar`

| Método | Ruta | Request DTO | Response |
|---|---|---|---|
| `GET` | `/api/roles` | — | `200` `IReadOnlyList<RolDto>` |
| `GET` | `/api/roles/permisos` | — | `200` `IReadOnlyList<PermisoDto>` |
| `POST` | `/api/roles` | `CrearRolRequest` | `201` `RolDto` |
| `PUT` | `/api/roles/{id}` | `ActualizarRolRequest` | `200` `RolDto` |
| `DELETE` | `/api/roles/{id}` | — | `204 No Content` |

**Estructuras DTO:**
- `RolDto`: `{ id, nombre, descripcion, esSistema, activo, totalUsuarios, permisos }`
- `PermisoDto`: `{ id, clave, modulo, descripcion }`
- `CrearRolRequest`: `{ nombre, descripcion, permisoClaves }`
- `ActualizarRolRequest`: `{ nombre, descripcion, activo, permisoClaves }`

---

### 4.3 Endpoints de Usuarios (`/api/usuarios`)
**Permiso requerido:** `usuarios.administrar`

| Método | Ruta | Request DTO | Response |
|---|---|---|---|
| `GET` | `/api/usuarios` | — | `200` `IReadOnlyList<UsuarioDto>` |
| `POST` | `/api/usuarios` | `CrearUsuarioRequest` | `201` `UsuarioDto` |
| `PUT` | `/api/usuarios/{id}` | `ActualizarUsuarioRequest` | `200` `UsuarioDto` |
| `PATCH` | `/api/usuarios/{id}/password` | `CambiarPasswordUsuarioRequest` | `204 No Content` |

**Estructuras DTO:**
- `UsuarioDto`: `{ id, nombreCompleto, correo, telefonoPaisCodigo, telefono, esPropietario, activo, rolId, rolNombre, ultimoAcceso, agendas: [{ id, nombre }] }`
- `CrearUsuarioRequest`: `{ nombreCompleto, correo, password, telefonoPaisCodigo, telefono, rolId, agendaIds }`
- `ActualizarUsuarioRequest`: `{ nombreCompleto, telefonoPaisCodigo, telefono, rolId, activo, agendaIds }`
- `CambiarPasswordUsuarioRequest`: `{ nuevaPassword }`

---

### 4.4 Endpoints de Catálogos (`/api/catalogos`)
**Acceso:** Anónimo (`[AllowAnonymous]`)

| Método | Ruta | Campos de respuesta |
|---|---|---|
| `GET` | `/api/catalogos/planes` | `id`, `codigo`, `nombre`, `descripcion`, `precioMensual`, `monedaCodigo`, `limiteAgendas`, `limiteUsuarios`, `incluyeMovimientos`, `incluyeReportes`, `incluyeInventario` |
| `GET` | `/api/catalogos/paises` | `codigo`, `nombre`, `codigoLada`, `monedaDefaultCodigo` |
| `GET` | `/api/catalogos/monedas?soloAgenda={bool}` | `codigo`, `nombre`, `simbolo`, `habilitadaEnAgenda`, `habilitadaEnMovimiento` |

---

## 5. Checklist de Alineación antes de Implementar

1. **Navegación RBAC en `AgendaPage.tsx`:** Filtrar los botones del menú con `hasPermission(...)` y `user.plan`, y elegir automáticamente el primer módulo permitido si el usuario no tiene acceso a `agenda`.
2. **Estado vacío de agendas:** Leer las agendas desde `user.agendas` en `AgendaPage.tsx`; si `user.agendas.length === 0`, mostrar un aviso claro de *"No tienes agendas asignadas"* y ocultar el calendario.
3. **Respaldo de validaciones en `apiClient.ts`:** Mejorar `parseError` para leer también el primer mensaje dentro de `errors` cuando ASP.NET Core devuelva un `400` de validación de DTO.
4. **Recarga de contexto (`AuthContext`):** Agregar `refreshUser()` para sincronizar `GET /api/auth/me` tras cambios en roles/permisos o agendas del usuario actual.
5. **Contratos exactos en `UsersModule.tsx`:** Deshabilitar/dejar solo lectura el campo `correo` al editar (porque `ActualizarUsuarioRequest` no lo modifica), permitir guardar `agendaIds: []` (0 agendas), cargar países/ladas desde `GET /api/catalogos/paises` y añadir pestaña dedicada de **Roles y Permisos**.
