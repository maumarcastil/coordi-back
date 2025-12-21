# Coordi Backend

API REST para gestión de envíos con cotizaciones, órdenes y tracking en tiempo real.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Fastify 5
- **Base de datos:** PostgreSQL 16
- **Caché:** Redis 7
- **Lenguaje:** TypeScript

## Requisitos

- Node.js 18+
- pnpm 10+
- Docker y Docker Compose

## Instalación

```bash
# Instalar dependencias
pnpm install

# Levantar PostgreSQL y Redis
docker compose up -d

# Configurar variables de entorno
cp .env.example .env

# Iniciar en desarrollo (las migraciones se ejecutan automáticamente)
pnpm dev
```

El servidor estará en `http://localhost:3000`

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `HOST` | Host del servidor | `0.0.0.0` |
| `NODE_ENV` | Entorno | `development` |
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Puerto PostgreSQL | `5432` |
| `DB_USER` | Usuario BD | `postgres` |
| `DB_PASSWORD` | Contraseña BD | requerido |
| `DB_NAME` | Nombre BD | `coordi` |
| `DB_MAX_CONNECTIONS` | Pool conexiones | `10` |
| `REDIS_HOST` | Host Redis | `localhost` |
| `REDIS_PORT` | Puerto Redis | `6379` |
| `REDIS_PASSWORD` | Contraseña Redis | opcional |
| `JWT_SECRET` | Secreto JWT | requerido |
| `JWT_EXPIRES_IN` | Expiración JWT | `7d` |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Desarrollo con hot-reload (migraciones automáticas) |
| `pnpm build` | Compilar para producción |
| `pnpm start` | Ejecutar en producción |
| `pnpm lint` | Verificar código |
| `pnpm test` | Ejecutar tests |
| `pnpm test:coverage` | Tests con cobertura |

## Arquitectura

El proyecto está inspirado en **Arquitectura Hexagonal** (Ports & Adapters):

```
src/
├── domain/          # Entidades y puertos (interfaces)
├── application/     # Casos de uso
├── infrastructure/  # Adaptadores (PostgreSQL, Redis, HTTP, WebSocket)
└── shared/          # Utilidades comunes
```

El dominio define los puertos (interfaces) y la infraestructura implementa los adaptadores, manteniendo la lógica de negocio desacoplada de tecnologías externas.

## API

| Ruta | Descripción |
|------|-------------|
| `GET /health` | Health check |
| `GET /docs` | Documentación Swagger |
| `/api/users` | Autenticación (registro/login) |
| `/api/cities` | Ciudades disponibles |
| `/api/quotes` | Cotizaciones de envío |
| `/api/orders` | Órdenes y tracking |
| `ws://host/ws/orders` | WebSocket para actualizaciones |

## Docker

```bash
# Iniciar servicios
docker compose up -d

# Detener servicios
docker compose down

# Reset completo (elimina datos)
docker compose down -v
```

## Licencia

ISC
