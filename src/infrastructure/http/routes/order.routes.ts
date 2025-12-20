import type { FastifyInstance } from "fastify";

import {
	createOrderHandler,
	getOrderByIdHandler,
	getOrderHistoryHandler,
	getUserOrdersHandler,
} from "@infrastructure/http/controllers/order.controller.js";
import { authMiddleware } from "@infrastructure/http/middlewares/auth.middleware.js";

const uuidPattern =
	"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

export async function orderRoutes(app: FastifyInstance): Promise<void> {
	// POST /orders - Crear orden desde cotización
	app.post("/orders", {
		preHandler: authMiddleware,
		schema: {
			description: "Crear una nueva orden de envío desde una cotización",
			tags: ["Orders"],
			security: [{ bearerAuth: [] }],
			body: {
				type: "object",
				required: [
					"quoteId",
					"senderName",
					"senderPhone",
					"senderAddress",
					"recipientName",
					"recipientPhone",
					"recipientAddress",
				],
				properties: {
					quoteId: { type: "number" },
					senderName: { type: "string", minLength: 2, maxLength: 100 },
					senderPhone: { type: "string", minLength: 7, maxLength: 20 },
					senderAddress: { type: "string", minLength: 10 },
					recipientName: { type: "string", minLength: 2, maxLength: 100 },
					recipientPhone: { type: "string", minLength: 7, maxLength: 20 },
					recipientAddress: { type: "string", minLength: 10 },
					packageDescription: { type: "string" },
				},
			},
			response: {
				201: {
					type: "object",
					properties: {
						order: {
							type: "object",
							properties: {
								id: { type: "string", format: "uuid" },
								quoteId: { type: "number" },
								trackingNumber: { type: "string" },
								currentStatus: { type: "string" },
								totalPrice: { type: "number" },
								estimatedDeliveryDate: { type: "string" },
								createdAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		handler: createOrderHandler,
	});

	// GET /orders - Listar órdenes del usuario
	app.get("/orders", {
		preHandler: authMiddleware,
		schema: {
			description: "Obtener todas las órdenes del usuario autenticado",
			tags: ["Orders"],
			security: [{ bearerAuth: [] }],
			response: {
				200: {
					type: "object",
					properties: {
						orders: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string", format: "uuid" },
									quoteId: { type: "number" },
									trackingNumber: { type: "string", nullable: true },
									currentStatus: { type: "string" },
									totalPrice: { type: "number" },
									originCityId: { type: "number" },
									destinationCityId: { type: "number" },
									originCityName: { type: "string" },
									destinationCityName: { type: "string" },
									senderName: { type: "string" },
									recipientName: { type: "string" },
									estimatedDeliveryDate: { type: "string", nullable: true },
									createdAt: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		handler: getUserOrdersHandler,
	});

	// GET /orders/:id - Obtener detalle de una orden
	app.get("/orders/:id", {
		preHandler: authMiddleware,
		schema: {
			description: "Obtener detalle de una orden específica",
			tags: ["Orders"],
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				required: ["id"],
				properties: {
					id: { type: "string", pattern: uuidPattern },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						order: {
							type: "object",
							properties: {
								id: { type: "string", format: "uuid" },
								quoteId: { type: "number" },
								userId: { type: "number" },
								originCityId: { type: "number" },
								destinationCityId: { type: "number" },
								originCity: {
									type: "object",
									properties: {
										id: { type: "number" },
										name: { type: "string" },
										department: { type: "string" },
										code: { type: "string" },
									},
								},
								destinationCity: {
									type: "object",
									properties: {
										id: { type: "number" },
										name: { type: "string" },
										department: { type: "string" },
										code: { type: "string" },
									},
								},
								weight: { type: "number" },
								length: { type: "number" },
								width: { type: "number" },
								height: { type: "number" },
								volumetricWeight: { type: "number" },
								chargeableWeight: { type: "number" },
								totalPrice: { type: "number" },
								trackingNumber: { type: "string", nullable: true },
								currentStatus: { type: "string" },
								senderName: { type: "string" },
								senderPhone: { type: "string" },
								senderAddress: { type: "string" },
								recipientName: { type: "string" },
								recipientPhone: { type: "string" },
								recipientAddress: { type: "string" },
								packageDescription: { type: "string", nullable: true },
								estimatedDeliveryDate: { type: "string", nullable: true },
								deliveredAt: { type: "string", nullable: true },
								cancelledAt: { type: "string", nullable: true },
								createdAt: { type: "string" },
								updatedAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		handler: getOrderByIdHandler,
	});

	// GET /orders/:id/history - Obtener historial de estados
	app.get("/orders/:id/history", {
		preHandler: authMiddleware,
		schema: {
			description: "Obtener historial de estados de una orden",
			tags: ["Orders"],
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				required: ["id"],
				properties: {
					id: { type: "string", pattern: uuidPattern },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						history: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string", format: "uuid" },
									orderId: { type: "string", format: "uuid" },
									status: { type: "string" },
									notes: { type: "string" },
									location: { type: "string" },
									changedByUserId: { type: "number" },
									changedBySystem: { type: "boolean" },
									createdAt: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		handler: getOrderHistoryHandler,
	});
}
