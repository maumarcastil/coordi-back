import type { FastifyInstance } from "fastify";

import { getCitiesHandler } from "@infrastructure/http/controllers/city.controller.js";
import { authMiddleware } from "@infrastructure/http/middlewares/auth.middleware.js";

export async function cityRoutes(app: FastifyInstance): Promise<void> {
	app.get("/cities", {
		preHandler: authMiddleware,
		schema: {
			description: "Obtener lista de ciudades activas",
			tags: ["Cities"],
			security: [{ bearerAuth: [] }],
			response: {
				200: {
					type: "object",
					properties: {
						cities: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "number" },
									name: { type: "string" },
									department: { type: "string" },
									code: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		handler: getCitiesHandler,
	});
}
