import type { FastifyReply, FastifyRequest } from "fastify";

import { CreateQuoteUseCase } from "@application/quote/create-quote.usecase.js";
import { GetQuoteByIdUseCase } from "@application/quote/get-quote-by-id.usecase.js";
import { GetUserQuotesUseCase } from "@application/quote/get-user-quotes.usecase.js";

import { PostgresQuoteRepository } from "@infrastructure/persistence/postgres-quote.repository.js";
import { PostgresRateRepository } from "@infrastructure/persistence/postgres-rate.repository.js";
import { CachedRateRepository } from "@infrastructure/persistence/cached-rate.repository.js";
import { RedisCacheService } from "@infrastructure/cache/redis-cache.service.js";

import {
	createQuoteSchema,
	quoteIdParamSchema,
	type CreateQuoteInput,
} from "@infrastructure/http/validations/quote.validation.js";

export async function createQuoteHandler(
	request: FastifyRequest<{ Body: CreateQuoteInput }>,
	reply: FastifyReply,
): Promise<void> {
	const validation = createQuoteSchema.safeParse(request.body);

	if (!validation.success) {
		return reply.status(400).send({
			error: "Datos de entrada inválidos",
			details: validation.error.flatten().fieldErrors,
		});
	}

	const userId = request.user?.userId;

	if (!userId) {
		return reply.status(401).send({ error: "Usuario no autenticado" });
	}

	try {
		const cacheService = new RedisCacheService(request.server.redis);
		const quoteRepository = new PostgresQuoteRepository(request.server.pg.pool);
		const postgresRateRepository = new PostgresRateRepository(
			request.server.pg.pool,
		);
		const rateRepository = new CachedRateRepository(
			postgresRateRepository,
			cacheService,
		);

		const useCase = new CreateQuoteUseCase(quoteRepository, rateRepository);

		const quote = await useCase.execute(userId, validation.data);

		return reply.status(201).send({ quote });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error al crear cotización";

		if (
			message === "La ciudad de origen y destino deben ser diferentes" ||
			message === "No existe tarifa para esta ruta" ||
			message === "La tarifa para esta ruta no está activa"
		) {
			return reply.status(400).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

export async function getUserQuotesHandler(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const userId = request.user?.userId;

	if (!userId) {
		return reply.status(401).send({ error: "Usuario no autenticado" });
	}

	try {
		const quoteRepository = new PostgresQuoteRepository(request.server.pg.pool);
		const useCase = new GetUserQuotesUseCase(quoteRepository);

		const quotes = await useCase.execute(userId);

		return reply.status(200).send({ quotes });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

export async function getQuoteByIdHandler(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply,
): Promise<void> {
	const paramValidation = quoteIdParamSchema.safeParse(request.params);

	if (!paramValidation.success) {
		return reply.status(400).send({
			error: "ID de cotización inválido",
		});
	}

	const userId = request.user?.userId;

	if (!userId) {
		return reply.status(401).send({ error: "Usuario no autenticado" });
	}

	const quoteId = Number.parseInt(paramValidation.data.id, 10);

	try {
		const quoteRepository = new PostgresQuoteRepository(request.server.pg.pool);
		const useCase = new GetQuoteByIdUseCase(quoteRepository);

		const quote = await useCase.execute(quoteId, userId);

		return reply.status(200).send({ quote });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error al obtener cotización";

		if (message === "Cotización no encontrada") {
			return reply.status(404).send({ error: message });
		}

		if (message === "No tienes permiso para ver esta cotización") {
			return reply.status(403).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}
