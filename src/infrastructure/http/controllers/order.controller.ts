import type { FastifyReply, FastifyRequest } from "fastify";

import { CreateOrderUseCase } from "@application/order/create-order.usecase.js";
import { GetOrderByIdUseCase } from "@application/order/get-order-by-id.usecase.js";
import { GetOrderHistoryUseCase } from "@application/order/get-order-history.usecase.js";
import { GetUserOrdersUseCase } from "@application/order/get-user-orders.usecase.js";

import { PostgresOrderStatusHistoryRepository } from "@infrastructure/persistence/postgres-order-status-history.repository.js";
import { PostgresOrderRepository } from "@infrastructure/persistence/postgres-order.repository.js";
import { PostgresQuoteRepository } from "@infrastructure/persistence/postgres-quote.repository.js";

import {
	createOrderSchema,
	orderIdParamSchema,
	type CreateOrderInput,
} from "@infrastructure/http/validations/order.validation.js";

export async function createOrderHandler(
	request: FastifyRequest<{ Body: CreateOrderInput }>,
	reply: FastifyReply,
): Promise<void> {
	const validation = createOrderSchema.safeParse(request.body);

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
		const orderRepository = new PostgresOrderRepository(request.server.pg.pool);
		const quoteRepository = new PostgresQuoteRepository(request.server.pg.pool);
		const statusHistoryRepository = new PostgresOrderStatusHistoryRepository(
			request.server.pg.pool,
		);

		const useCase = new CreateOrderUseCase(
			orderRepository,
			quoteRepository,
			statusHistoryRepository,
		);

		const order = await useCase.execute(userId, validation.data);

		return reply.status(201).send({ order });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error al crear orden";

		const badRequestMessages = [
			"Cotización no encontrada",
			"No tienes permiso para crear una orden con esta cotización",
			"Esta cotización ya fue convertida o ha expirado",
			"Esta cotización ha expirado",
			"Ya existe una orden para esta cotización",
		];

		if (badRequestMessages.includes(message)) {
			return reply.status(400).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

export async function getUserOrdersHandler(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const userId = request.user?.userId;

	if (!userId) {
		return reply.status(401).send({ error: "Usuario no autenticado" });
	}

	try {
		const orderRepository = new PostgresOrderRepository(request.server.pg.pool);
		const useCase = new GetUserOrdersUseCase(orderRepository);

		const orders = await useCase.execute(userId);

		return reply.status(200).send({ orders });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

export async function getOrderByIdHandler(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply,
): Promise<void> {
	const paramValidation = orderIdParamSchema.safeParse(request.params);

	if (!paramValidation.success) {
		return reply.status(400).send({
			error: "ID de orden inválido",
		});
	}

	const userId = request.user?.userId;

	if (!userId) {
		return reply.status(401).send({ error: "Usuario no autenticado" });
	}

	const orderId = paramValidation.data.id;

	try {
		const orderRepository = new PostgresOrderRepository(request.server.pg.pool);
		const useCase = new GetOrderByIdUseCase(orderRepository);

		const order = await useCase.execute(orderId, userId);

		return reply.status(200).send({ order });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error al obtener orden";

		if (message === "Orden no encontrada") {
			return reply.status(404).send({ error: message });
		}

		if (message === "No tienes permiso para ver esta orden") {
			return reply.status(403).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

export async function getOrderHistoryHandler(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply,
): Promise<void> {
	const paramValidation = orderIdParamSchema.safeParse(request.params);

	if (!paramValidation.success) {
		return reply.status(400).send({
			error: "ID de orden inválido",
		});
	}

	const userId = request.user?.userId;

	if (!userId) {
		return reply.status(401).send({ error: "Usuario no autenticado" });
	}

	const orderId = paramValidation.data.id;

	try {
		const orderRepository = new PostgresOrderRepository(request.server.pg.pool);
		const statusHistoryRepository = new PostgresOrderStatusHistoryRepository(
			request.server.pg.pool,
		);

		const useCase = new GetOrderHistoryUseCase(
			orderRepository,
			statusHistoryRepository,
		);

		const history = await useCase.execute(orderId, userId);

		return reply.status(200).send({ history });
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Error al obtener historial de orden";

		if (message === "Orden no encontrada") {
			return reply.status(404).send({ error: message });
		}

		if (message === "No tienes permiso para ver esta orden") {
			return reply.status(403).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

