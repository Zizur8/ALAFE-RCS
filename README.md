# ALAFE

**ALAFE** es un monorepo que contiene la aplicación completa del proyecto:

- **`/backend`** — API REST construida con **ASP.NET Core Web API (.NET 10)**, Entity Framework Core (SQL Server) y autenticación **JWT**.
- **`/frontend`** — SPA construida con **React 19 + TypeScript + Vite** y enrutamiento con `react-router-dom`.

> Estado actual: **esqueleto base (skeleton)**. La lógica de negocio se implementará por etapas.

---

## Estructura del repositorio

```
.
├── backend/                      # API ASP.NET Core (.NET 10)
│   ├── Controllers/              # Controladores (HealthController → GET /api/health)
│   ├── Services/                 # Servicios de negocio
│   ├── Repositories/             # Acceso a datos
│   ├── Data/                     # AlafeDbContext + configuraciones IEntityTypeConfiguration
│   │   └── Migrations/           # Migraciones de EF Core
│   ├── Models/                   # Entidades de dominio
│   ├── DTOs/                     # Contratos de entrada/salida
│   ├── Middlewares/              # ExceptionMiddleware (errores JSON uniformes)
│   ├── Properties/launchSettings.json
│   ├── appsettings.json          # Configuración base
│   └── appsettings.Example.json  # Plantilla con placeholders (sin secretos)
│
├── frontend/                     # SPA React 19 + TypeScript + Vite
│   └── src/
│       ├── pages/                # Login, MainAppAgenda, Clientes, PermisosUsuarios, Configuracion
│       ├── components/           # Layout (menú lateral/superior responsivo)
│       ├── services/             # apiClient.ts (HTTP centralizado + Bearer token)
│       ├── context/              # AuthContext.tsx
│       ├── routes/               # ProtectedRoute.tsx
│       ├── hooks/                # Hooks personalizados
│       └── types/                # Tipos compartidos
│
├── docs/c4/                      # Diagramas C4 (Contexto y Contenedores)
├── .github/workflows/ci.yml      # CI: build backend + frontend (push/PR a main y develop)
├── .gitignore
└── README.md
```

---

## Requisitos

- .NET SDK **10.x**
- Node.js **LTS** (v20+) y npm
- SQL Server (local o remoto) para la capa de datos

---

## Ejecución local

### 1. Backend (API)

```bash
cd backend
cp appsettings.Example.json appsettings.json   # y completar ConnectionStrings + Jwt
dotnet restore
dotnet run --launch-profile http                # → http://localhost:5000
```

- Puerto HTTP: **`http://localhost:5000`** (definido en `backend/Properties/launchSettings.json`).
- Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`.

### 2. Frontend (SPA)

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm ci
npm run dev                 # → http://localhost:5173
```

- Puerto de desarrollo Vite: **`http://localhost:5173`**.

### 3. Compilación de verificación

```bash
dotnet build --configuration Release   # desde /backend
npm run build                          # desde /frontend
```

---

## Configuración y secretos

- `backend/appsettings.Example.json` es la **plantilla**: contiene placeholders para `ConnectionStrings:DefaultConnection` y `Jwt`. Cópialo a `appsettings.json` y completa tus valores.
- `appsettings.Development.json`, `.env` y `.env.local` están **ignorados por git** (están en `.gitignore`).
- La clave JWT, issuer y audience se leen de la sección `Jwt` de la configuración.
- El origen permitido de CORS se lee de `Cors:AllowedOrigins` e incluye `http://localhost:5173` para desarrollo local.

---

## CI / CD

`.github/workflows/ci.yml` se ejecuta en `push` y `pull_request` hacia `main` y `develop`, con dos jobs paralelos:

| Job | Herramienta | Comandos |
|-----|-------------|----------|
| `build-backend` | .NET 10 | `dotnet restore` + `dotnet build --configuration Release` |
| `build-frontend` | Node.js LTS | `npm ci` + `npm run build` |

---

## Enlaces de publicación

_Completar cuando se publiquen los entornos:_

- **Frontend (Vercel):** https://___-frontend.vercel.app
- **API publicada:** https://___-api.example.com
- **Documentación OpenAPI (Swagger):** https://___-api.example.com/openapi

---

## Diagramas de arquitectura

Los diagramas **C4 de Contexto y Contenedores** se encuentran en [`docs/c4/`](docs/c4/README.md).
