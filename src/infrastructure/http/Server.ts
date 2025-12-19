import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyPostgres from "@fastify/postgres";

import { registerRoutes } from "./routes/index.js";

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

	await app.register(swagger, {
		openapi: {
			info: {
				title: "Coordi API",
				description: "API documentation",
				version: "1.0.0",
			},
		},
	});

	await app.register(swaggerUi, {
		routePrefix: "/docs",
	});

	// Registrar rutas
	await registerRoutes(app);

	return app;
};
