import type { ShippingRate } from "@domain/rate/rate.entity.js";
import type { IRateRepository } from "@domain/rate/rate.repository.js";
import type { ICacheService } from "@domain/cache/cache.service.js";

const CACHE_PREFIX = "rate";
const TTL_SECONDS = 21600; // 6 horas

export class CachedRateRepository implements IRateRepository {
	constructor(
		private readonly rateRepository: IRateRepository,
		private readonly cacheService: ICacheService,
	) {}

	async findByPair(
		cityAId: number,
		cityBId: number,
	): Promise<ShippingRate | null> {
		// Ordenar IDs para consistencia en la clave de cache
		const [minId, maxId] = [
			Math.min(cityAId, cityBId),
			Math.max(cityAId, cityBId),
		];
		const cacheKey = `${CACHE_PREFIX}:${minId}:${maxId}`;

		// Intentar obtener del cache primero
		const cached = await this.cacheService.get<ShippingRate>(cacheKey);
		if (cached) {
			return cached;
		}

		// Si no está en cache, obtener de la base de datos
		const rate = await this.rateRepository.findByPair(cityAId, cityBId);

		// Guardar en cache solo si existe la tarifa
		if (rate) {
			await this.cacheService.set(cacheKey, rate, TTL_SECONDS);
		}

		return rate;
	}

	/**
	 * Invalida el cache de una tarifa específica.
	 * Llamar este método cuando se modifique una tarifa.
	 */
	async invalidateCache(cityAId: number, cityBId: number): Promise<void> {
		const [minId, maxId] = [
			Math.min(cityAId, cityBId),
			Math.max(cityAId, cityBId),
		];
		const cacheKey = `${CACHE_PREFIX}:${minId}:${maxId}`;
		await this.cacheService.delete(cacheKey);
	}

	/**
	 * Invalida todo el cache de tarifas.
	 * Usar con precaución, solo cuando se actualicen muchas tarifas.
	 */
	async invalidateAllCache(): Promise<void> {
		await this.cacheService.deletePattern(`${CACHE_PREFIX}:*`);
	}
}
