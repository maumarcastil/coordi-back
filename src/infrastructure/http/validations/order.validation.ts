import { z } from "zod";

export const createOrderSchema = z.object({
	quoteId: z.number().int().positive("El ID de cotización es requerido"),
	senderName: z
		.string()
		.min(2, "El nombre del remitente debe tener al menos 2 caracteres")
		.max(100, "El nombre del remitente no puede exceder 100 caracteres"),
	senderPhone: z
		.string()
		.min(7, "El teléfono del remitente debe tener al menos 7 dígitos")
		.max(20, "El teléfono del remitente no puede exceder 20 caracteres"),
	senderAddress: z
		.string()
		.min(10, "La dirección del remitente debe tener al menos 10 caracteres"),
	recipientName: z
		.string()
		.min(2, "El nombre del destinatario debe tener al menos 2 caracteres")
		.max(100, "El nombre del destinatario no puede exceder 100 caracteres"),
	recipientPhone: z
		.string()
		.min(7, "El teléfono del destinatario debe tener al menos 7 dígitos")
		.max(20, "El teléfono del destinatario no puede exceder 20 caracteres"),
	recipientAddress: z
		.string()
		.min(10, "La dirección del destinatario debe tener al menos 10 caracteres"),
	packageDescription: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const orderIdParamSchema = z.object({
	id: z.string().regex(uuidRegex, "El ID debe ser un UUID válido"),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

export const updateOrderStatusSchema = z.object({
	status: z.enum(
		["pending", "confirmed", "in_transit", "delivered", "cancelled"],
		{
			message:
				"Estado inválido. Debe ser: pending, confirmed, in_transit, delivered o cancelled",
		},
	),
	notes: z
		.string()
		.max(500, "Las notas no pueden exceder 500 caracteres")
		.optional(),
	location: z
		.string()
		.max(200, "La ubicación no puede exceder 200 caracteres")
		.optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
