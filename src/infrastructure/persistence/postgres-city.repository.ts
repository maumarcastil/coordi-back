import type { Pool } from "pg";

import type { City } from "@domain/city/city.entity.js";
import type { ICityRepository } from "@domain/city/city.repository.js";

export class PostgresCityRepository implements ICityRepository {
	constructor(private readonly pool: Pool) {}

	async findAllActive(): Promise<City[]> {
		const result = await this.pool.query(
			`SELECT id, name, department, code, is_active 
			 FROM cities 
			 WHERE is_active = true 
			 ORDER BY name`,
		);

		return result.rows.map((row) => this.mapToCity(row));
	}

	private mapToCity(row: {
		id: number;
		name: string;
		department: string;
		code: string;
		is_active: boolean;
	}): City {
		return {
			id: row.id,
			name: row.name,
			department: row.department,
			code: row.code,
			isActive: row.is_active,
		};
	}
}

