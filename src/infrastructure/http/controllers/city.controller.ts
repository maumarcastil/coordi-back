import type { FastifyReply, FastifyRequest } from "fastify";

import { GetCitiesUseCase } from "@application/city/get-cities.usecase.js";
import { PostgresCityRepository } from "@infrastructure/persistence/postgres-city.repository.js";

export async function getCitiesHandler(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	try {
		const cityRepository = new PostgresCityRepository(request.server.pg.pool);
		const useCase = new GetCitiesUseCase(cityRepository);
		const cities = await useCase.execute();

		return reply.status(200).send({ cities });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}

