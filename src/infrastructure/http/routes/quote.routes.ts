import type { FastifyInstance } from "fastify";

import {
	createQuoteHandler,
	getQuoteByIdHandler,
	getUserQuotesHandler,
} from "@infrastructure/http/controllers/quote.controller.js";
import { authMiddleware } from "@infrastructure/http/middlewares/auth.middleware.js";

export async function quoteRoutes(app: FastifyInstance): Promise<void> {
	// POST /quotes - Crear cotización
	app.post("/quotes", {
		preHandler: authMiddleware,
		schema: {
			description: "Crear una nueva cotización de envío",
			tags: ["Quotes"],
			security: [{ bearerAuth: [] }],
			body: {
				type: "object",
				required: [
					"originCityId",
					"destinationCityId",
					"weight",
					"length",
					"width",
					"height",
				],
				properties: {
					originCityId: { type: "number" },
					destinationCityId: { type: "number" },
					weight: { type: "number", minimum: 0.1 },
					length: { type: "number", minimum: 1 },
					width: { type: "number", minimum: 1 },
					height: { type: "number", minimum: 1 },
				},
			},
			response: {
				201: {
					type: "object",
					properties: {
						quote: {
							type: "object",
							properties: {
								id: { type: "number" },
								originCityId: { type: "number" },
								destinationCityId: { type: "number" },
								weight: { type: "number" },
								length: { type: "number" },
								width: { type: "number" },
								height: { type: "number" },
								volumetricWeight: { type: "number" },
								chargeableWeight: { type: "number" },
								totalPrice: { type: "number" },
								status: { type: "string" },
								expiresAt: { type: "string" },
								createdAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		handler: createQuoteHandler,
	});

	// GET /quotes - Listar cotizaciones del usuario
	app.get("/quotes", {
		preHandler: authMiddleware,
		schema: {
			description: "Obtener todas las cotizaciones del usuario autenticado",
			tags: ["Quotes"],
			security: [{ bearerAuth: [] }],
			response: {
				200: {
					type: "object",
					properties: {
						quotes: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "number" },
									originCityId: { type: "number" },
									destinationCityId: { type: "number" },
									weight: { type: "number" },
									volumetricWeight: { type: "number" },
									chargeableWeight: { type: "number" },
									totalPrice: { type: "number" },
									status: { type: "string" },
									expiresAt: { type: "string" },
									createdAt: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		handler: getUserQuotesHandler,
	});

	// GET /quotes/:id - Obtener cotización por ID
	app.get("/quotes/:id", {
		preHandler: authMiddleware,
		schema: {
			description: "Obtener detalle de una cotización específica",
			tags: ["Quotes"],
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				required: ["id"],
				properties: {
					id: { type: "string", pattern: "^\\d+$" },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						quote: {
							type: "object",
							properties: {
								id: { type: "number" },
								userId: { type: "number" },
								originCityId: { type: "number" },
								destinationCityId: { type: "number" },
								weight: { type: "number" },
								length: { type: "number" },
								width: { type: "number" },
								height: { type: "number" },
								volumetricWeight: { type: "number" },
								chargeableWeight: { type: "number" },
								totalPrice: { type: "number" },
								status: { type: "string" },
								expiresAt: { type: "string" },
								createdAt: { type: "string" },
								updatedAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		handler: getQuoteByIdHandler,
	});
}

