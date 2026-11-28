# Validación E2E — Parte 3: Administración Multi-Tenant (Backend ALAFE)

## 1. Contexto de ejecución

* **Proyecto:** ALAFE (`ASP.NET Core .NET 10` + `EF Core` + `SQL Server 2022` en Docker)
* **Rama:** `feature/backend-admin-crud`
* **Fecha:** 27 de noviembre de 2026
* **Entorno probado:** `http://localhost:5000` (perfil `http`, base de datos local `ALAFE`)
* **Herramienta de prueba:** Script temporal en Python 3 (`/tmp/test_parte3.py`, fuera del repositorio Git)
* **Nota de ejecución:** El sandbox inicial bloqueó la conexión local (`Operation not permitted`); tras autorizar la ejecución local fuera del sandbox, la suite corrió completa contra la API real.
* **Resultado global:** **24 / 24 casos aprobados (`100% PASS`)**

---

## 2. Alcance y contratos verificados

### Endpoints y autorización RBAC (`[RequirePermission]`)
* **Roles y permisos (`permisos.administrar`):**
  * `GET /api/roles/permisos`
  * `GET /api/roles`
  * `POST /api/roles`
  * `PUT /api/roles/{id}`
  * `DELETE /api/roles/{id}`
* **Usuarios (`usuarios.administrar`):**
  * `GET /api/usuarios`
  * `POST /api/usuarios`
  * `PUT /api/usuarios/{id}`
  * `PATCH /api/usuarios/{id}/password`
* **Configuración general (`config.cuenta.editar`):**
  * `GET /api/configuracion/general`
  * `PUT /api/configuracion/general`
* **Configuración de agendas (`agendas.administrar`):**
  * `GET /api/configuracion/agendas`
  * `POST /api/configuracion/agendas`
  * `PUT /api/configuracion/agendas/{id}`

### Restricciones alineadas con SQL Server (`CHECK` / `EntityConfigurations.cs`)
* `TemaVisual`: únicamente `claro` | `oscuro`
* `VistaAgendaDefault`: únicamente `mes` | `lista`
* `ZonaHoraria`: validada mediante `TimeZoneInfo.TryFindSystemTimeZoneById` (formato IANA)

---

## 3. Matriz de resultados E2E (24 casos)

| # | Caso | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| 1 | Login Admin (`admin@alafe.local`) | `200` | `200` | **PASS** |
| 2 | Catálogo de permisos | `200`, 11 permisos | `200`, 11 | **PASS** |
| 3 | Listado de roles | `200`, al menos 2 de sistema | `200`, cumple | **PASS** |
| 4 | Crear rol personalizado | `201` | `201` | **PASS** |
| 5 | Actualizar rol | `200` | `200` | **PASS** |
| 6 | Proteger rol de sistema contra borrado | `400` o `403` | `403` | **PASS** |
| 7 | Leer configuración general | `200` | `200` | **PASS** |
| 8 | Actualizar preferencias válidas (`oscuro`, `lista`) | `200` | `200` | **PASS** |
| 9 | Rechazar vista inválida (`semana`) | `400` | `400` | **PASS** |
| 10 | Restaurar preferencias originales | `200` | `200` | **PASS** |
| 11 | Crear segunda agenda | `201` | `201` | **PASS** |
| 12 | Actualizar segunda agenda (nota general) | `200` | `200` | **PASS** |
| 13 | Listar ambas agendas | `200`, ambas presentes | `200`, ambas presentes | **PASS** |
| 14 | Rechazar zona horaria inválida | `400` | `400` | **PASS** |
| 15 | Crear usuario asignado solo a primera agenda | `201` | `201` | **PASS** |
| 16 | Login de usuario nuevo | `200` | `200` | **PASS** |
| 17 | Aislamiento de agendas en `GET /api/auth/me` | Solo primera agenda | Solo primera agenda | **PASS** |
| 18 | RBAC: usuario sin permiso no lista roles | `403` | `403` | **PASS** |
| 19 | RBAC: usuario sin permiso no lista configuración | `403` | `403` | **PASS** |
| 20 | Restablecer contraseña (`PATCH /password`) | `204` | `204` | **PASS** |
| 21 | Invalidación inmediata del token anterior (`TokenVersion`) | `401` | `401` | **PASS** |
| 22 | Desactivar usuario (`activo: false`) | `200` | `200` | **PASS** |
| 23 | Bloquear login de usuario desactivado | `401` o `403` | `401` | **PASS** |
| 24 | Impedir borrar rol con usuario asignado | `409` | `409` | **PASS** |

---

## 4. Hallazgos y estado residual en la base de datos local

* **Preferencias restauradas:** El script devolvió `TemaVisual` y `VistaAgendaDefault` de la cuenta administradora a sus valores originales.
* **Registros sintéticos conservados:** En la base local `ALAFE` permanecen los registros creados durante la prueba (rol personalizado, segunda agenda y usuario desactivado), todos identificados con sufijo de timestamp único.
* **Integridad referencial comprobada:** El intento de eliminar el rol personalizado respondió `409 Conflict` porque aún mantenía la referencia del usuario de prueba asignado.
* **Compilación:** `dotnet build --configuration Release --no-restore` finalizó con `0 errores` y `0 warnings`.

---

## 5. Siguientes pasos operativos

- [ ] Verificar con `git status` que no existan archivos `appsettings*.json` ni scripts temporales rastreados.
- [ ] Hacer commit y push de `feature/backend-admin-crud` y abrir PR hacia `develop`.
- [ ] Definir siguiente bloque: conectar frontend React (Auth, Roles/Usuarios y Configuración) o desarrollar los módulos core de **Clientes y Eventos** en `/backend`.