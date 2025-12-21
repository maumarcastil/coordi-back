import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyPostgres from "@fastify/postgres";
import fastifyRedis from "@fastify/redis";
import websocket from "@fastify/websocket";

import { registerRoutes } from "./routes/index.js";
import { registerWebSocketRoutes } from "@infrastructure/websocket/ws.routes.js";

import { loadEnvConfig } from "@infrastructure/config/env.config.js";

export const createServer = async () => {
	const config = loadEnvConfig();

	const app = Fastify({
		logger: true,
	});

	await app.register(cors);

	await app.register(fastifyPostgres, {
		host: config.database.host,
		port: config.database.port,
		user: config.database.user,
		password: config.database.password,
		database: config.database.name,
		max: config.database.maxConnections,
	});

	await app.register(fastifyRedis, {
		host: config.redis.host,
		port: config.redis.port,
		password: config.redis.password,
	});

	await app.register(swagger, {
		openapi: {
			info: {
				title: "Coordi API",
				description: "API documentation",
				version: "1.0.0",
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
		},
	});

	await app.register(swaggerUi, {
		routePrefix: "/docs",
	});

	// Registrar plugin WebSocket
	await app.register(websocket);

	// Registrar rutas HTTP
	await registerRoutes(app);

	// Registrar rutas WebSocket
	await registerWebSocketRoutes(app);

	return app;
};
