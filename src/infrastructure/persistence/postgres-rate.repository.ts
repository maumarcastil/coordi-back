import type { Pool } from "pg";

import type { ShippingRate } from "@domain/rate/rate.entity.js";
import type { IRateRepository } from "@domain/rate/rate.repository.js";

export class PostgresRateRepository implements IRateRepository {
	constructor(private readonly pool: Pool) {}

	async findByPair(
		cityAId: number,
		cityBId: number,
	): Promise<ShippingRate | null> {
		// Asegurar que los IDs estén ordenados (city_a_id < city_b_id)
		const [minId, maxId] = [Math.min(cityAId, cityBId), Math.max(cityAId, cityBId)];

		const result = await this.pool.query(
			`SELECT id, city_a_id, city_b_id, base_price, price_per_kg, distance_km, is_active
			 FROM shipping_rates
			 WHERE city_a_id = $1 AND city_b_id = $2`,
			[minId, maxId],
		);

		return result.rows[0] ? this.mapToRate(result.rows[0]) : null;
	}

	private mapToRate(row: {
		id: number;
		city_a_id: number;
		city_b_id: number;
		base_price: string;
		price_per_kg: string;
		distance_km: number | null;
		is_active: boolean;
	}): ShippingRate {
		return {
			id: row.id,
			cityAId: row.city_a_id,
			cityBId: row.city_b_id,
			basePrice: Number.parseFloat(row.base_price),
			pricePerKg: Number.parseFloat(row.price_per_kg),
			distanceKm: row.distance_km,
			isActive: row.is_active,
		};
	}
}

