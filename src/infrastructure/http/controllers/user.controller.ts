import type { FastifyReply, FastifyRequest } from "fastify";

import {
	loginSchema,
	registerSchema,
	type LoginInput,
	type RegisterInput,
} from "@infrastructure/http/validations/user.validation.js";

import { LoginUserUseCase } from "@application/user/login-user.usecase.js";
import { RegisterUserUseCase } from "@application/user/register-user.usecase.js";

import { PostgresUserRepository } from "@infrastructure/persistence/postgres-user.repository.js";

export async function registerHandler(
	request: FastifyRequest<{ Body: RegisterInput }>,
	reply: FastifyReply,
): Promise<void> {
	const validation = registerSchema.safeParse(request.body);

	if (!validation.success) {
		return reply.status(400).send({
			error: "Datos de entrada inválidos",
			details: validation.error.flatten().fieldErrors,
		});
	}

	try {
		const userRepository = new PostgresUserRepository(request.server.pg.pool);
		const useCase = new RegisterUserUseCase(userRepository);
		const result = await useCase.execute(validation.data);

		return reply.status(201).send(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error al registrar usuario";

		if (message === "El email ya está registrado") {
			return reply.status(409).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

export async function loginHandler(
	request: FastifyRequest<{ Body: LoginInput }>,
	reply: FastifyReply,
): Promise<void> {
	const validation = loginSchema.safeParse(request.body);

	if (!validation.success) {
		return reply.status(400).send({
			error: "Datos de entrada inválidos",
			details: validation.error.flatten().fieldErrors,
		});
	}

	try {
		const userRepository = new PostgresUserRepository(request.server.pg.pool);
		const useCase = new LoginUserUseCase(userRepository);
		const result = await useCase.execute(validation.data);

		return reply.status(200).send(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Error al iniciar sesión";

		if (message === "Credenciales inválidas") {
			return reply.status(401).send({ error: message });
		}

		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}
