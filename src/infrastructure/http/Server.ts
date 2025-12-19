import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export const createServer = async () => {
	const app = Fastify({
		logger: true,
	});

	await app.register(cors);

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

	return app;
};
