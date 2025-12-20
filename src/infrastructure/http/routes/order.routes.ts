import type { FastifyInstance } from "fastify";

import {
	createOrderHandler,
	getOrderByIdHandler,
	getOrderHistoryHandler,
	getUserOrdersHandler,
	updateOrderStatusHandler,
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

	// PATCH /orders/:id/status - Actualizar estado de una orden
	app.patch("/orders/:id/status", {
		preHandler: authMiddleware,
		schema: {
			description:
				"Actualizar el estado de una orden. Los estados válidos son: pending, confirmed, in_transit, delivered, cancelled. " +
				"Las transiciones permitidas son: pending → confirmed/cancelled, confirmed → in_transit/cancelled, in_transit → delivered/cancelled. " +
				"Los estados 'delivered' y 'cancelled' son finales y no permiten más cambios.",
			tags: ["Orders"],
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				required: ["id"],
				properties: {
					id: {
						type: "string",
						pattern: uuidPattern,
						description: "UUID de la orden a actualizar",
					},
				},
			},
			body: {
				type: "object",
				required: ["status"],
				properties: {
					status: {
						type: "string",
						enum: [
							"pending",
							"confirmed",
							"in_transit",
							"delivered",
							"cancelled",
						],
						description:
							"Nuevo estado de la orden. Estados: pending (Pendiente), confirmed (Confirmada), in_transit (En Tránsito), delivered (Entregada), cancelled (Cancelada)",
					},
					notes: {
						type: "string",
						maxLength: 500,
						description:
							"Notas opcionales sobre el cambio de estado (ej: 'Paquete salió de bodega', 'Cliente no disponible')",
					},
					location: {
						type: "string",
						maxLength: 200,
						description:
							"Ubicación opcional donde se realizó el cambio (ej: 'Bodega Bogotá', 'Centro de distribución Medellín')",
					},
				},
			},
			response: {
				200: {
					type: "object",
					description: "Estado actualizado exitosamente",
					properties: {
						order: {
							type: "object",
							properties: {
								id: { type: "string", format: "uuid" },
								currentStatus: { type: "string" },
								updatedAt: { type: "string" },
							},
						},
						statusHistory: {
							type: "object",
							properties: {
								id: { type: "string", format: "uuid" },
								orderId: { type: "string", format: "uuid" },
								status: { type: "string" },
								notes: { type: "string", nullable: true },
								location: { type: "string", nullable: true },
								changedByUserId: { type: "number", nullable: true },
								changedBySystem: { type: "boolean" },
								createdAt: { type: "string" },
							},
						},
					},
				},
				400: {
					type: "object",
					description: "Error de validación o transición de estado inválida",
					properties: {
						error: { type: "string" },
						details: { type: "object" },
					},
				},
				404: {
					type: "object",
					description: "Orden no encontrada",
					properties: {
						error: { type: "string" },
					},
				},
			},
		},
		handler: updateOrderStatusHandler,
	});
}
