import {
	loginHandler,
	registerHandler,
} from "@infrastructure/http/controllers/user.controller.js";
import type { FastifyInstance } from "fastify";

export async function userRoutes(app: FastifyInstance): Promise<void> {
	app.post("/auth/register", {
		schema: {
			description: "Registrar un nuevo usuario",
			tags: ["Auth"],
			body: {
				type: "object",
				required: ["email", "password", "name"],
				properties: {
					email: { type: "string", format: "email" },
					password: { type: "string", minLength: 6 },
					name: { type: "string", minLength: 2 },
				},
			},
			response: {
				201: {
					type: "object",
					properties: {
						token: { type: "string" },
						user: {
							type: "object",
							properties: {
								id: { type: "number" },
								email: { type: "string" },
								name: { type: "string" },
								createdAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		handler: registerHandler,
	});

	app.post("/auth/login", {
		schema: {
			description: "Iniciar sesión",
			tags: ["Auth"],
			body: {
				type: "object",
				required: ["email", "password"],
				properties: {
					email: { type: "string", format: "email" },
					password: { type: "string" },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						token: { type: "string" },
						user: {
							type: "object",
							properties: {
								id: { type: "number" },
								email: { type: "string" },
								name: { type: "string" },
								createdAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		handler: loginHandler,
	});
}
