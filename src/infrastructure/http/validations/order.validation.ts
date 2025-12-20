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

