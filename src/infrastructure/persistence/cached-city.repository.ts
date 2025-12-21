import type { City } from "@domain/city/city.entity.js";
import type { ICityRepository } from "@domain/city/city.repository.js";
import type { ICacheService } from "@domain/cache/cache.service.js";

const CACHE_KEY = "cities:active";
const TTL_SECONDS = 86400; // 24 horas

export class CachedCityRepository implements ICityRepository {
	constructor(
		private readonly cityRepository: ICityRepository,
		private readonly cacheService: ICacheService,
	) {}

	async findAllActive(): Promise<City[]> {
		// Intentar obtener del cache primero
		const cached = await this.cacheService.get<City[]>(CACHE_KEY);
		if (cached) {
			return cached;
		}

		// Si no está en cache, obtener de la base de datos
		const cities = await this.cityRepository.findAllActive();

		// Guardar en cache para futuras consultas
		await this.cacheService.set(CACHE_KEY, cities, TTL_SECONDS);

		return cities;
	}

	/**
	 * Invalida el cache de ciudades.
	 * Llamar este método cuando se modifiquen las ciudades.
	 */
	async invalidateCache(): Promise<void> {
		await this.cacheService.delete(CACHE_KEY);
	}
}
