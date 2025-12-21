import { z } from "zod";

export const createQuoteSchema = z.object({
	originCityId: z.number().int().positive("La ciudad de origen es requerida"),
	destinationCityId: z
		.number()
		.int()
		.positive("La ciudad de destino es requerida"),
	weight: z.number().min(0.1, "El peso debe ser mayor a 0.1 kg"),
	length: z.number().min(1, "El largo debe ser mayor a 1 cm"),
	width: z.number().min(1, "El ancho debe ser mayor a 1 cm"),
	height: z.number().min(1, "El alto debe ser mayor a 1 cm"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const quoteIdParamSchema = z.object({
	id: z.string().regex(/^\d+$/, "El ID debe ser un número"),
});

export type QuoteIdParam = z.infer<typeof quoteIdParamSchema>;

