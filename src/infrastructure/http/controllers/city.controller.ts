import type { FastifyReply, FastifyRequest } from "fastify";

import { GetCitiesUseCase } from "@application/city/get-cities.usecase.js";
import { PostgresCityRepository } from "@infrastructure/persistence/postgres-city.repository.js";
import { CachedCityRepository } from "@infrastructure/persistence/cached-city.repository.js";
import { RedisCacheService } from "@infrastructure/cache/redis-cache.service.js";

export async function getCitiesHandler(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	try {
		const cacheService = new RedisCacheService(request.server.redis);
		const postgresCityRepository = new PostgresCityRepository(
			request.server.pg.pool,
		);
		const cityRepository = new CachedCityRepository(
			postgresCityRepository,
			cacheService,
		);

		const useCase = new GetCitiesUseCase(cityRepository);
		const cities = await useCase.execute();

		return reply.status(200).send({ cities });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ error: "Error interno del servidor" });
	}
}
