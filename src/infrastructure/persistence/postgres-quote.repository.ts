import type { Pool } from "pg";

import type { CreateQuoteData, Quote } from "@domain/quote/quote.entity.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";

export class PostgresQuoteRepository implements IQuoteRepository {
	constructor(private readonly pool: Pool) {}

	async create(data: CreateQuoteData): Promise<Quote> {
		const result = await this.pool.query(
			`INSERT INTO quotes (
				user_id, origin_city_id, destination_city_id,
				weight, length, width, height,
				volumetric_weight, chargeable_weight, total_price,
				expires_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING *`,
			[
				data.userId,
				data.originCityId,
				data.destinationCityId,
				data.weight,
				data.length,
				data.width,
				data.height,
				data.volumetricWeight,
				data.chargeableWeight,
				data.totalPrice,
				data.expiresAt,
			],
		);

		return this.mapToQuote(result.rows[0]);
	}

	async findByUserId(userId: number): Promise<Quote[]> {
		const result = await this.pool.query(
			`SELECT * FROM quotes 
			 WHERE user_id = $1 
			 ORDER BY created_at DESC`,
			[userId],
		);

		return result.rows.map((row) => this.mapToQuote(row));
	}

	async findById(id: number): Promise<Quote | null> {
		const result = await this.pool.query(
			`SELECT * FROM quotes WHERE id = $1`,
			[id],
		);

		return result.rows[0] ? this.mapToQuote(result.rows[0]) : null;
	}

	private mapToQuote(row: {
		id: number;
		user_id: number;
		origin_city_id: number;
		destination_city_id: number;
		weight: string;
		length: string;
		width: string;
		height: string;
		volumetric_weight: string;
		chargeable_weight: string;
		total_price: string;
		status: "pending" | "converted" | "expired";
		expires_at: Date;
		created_at: Date;
		updated_at: Date;
	}): Quote {
		return {
			id: row.id,
			userId: row.user_id,
			originCityId: row.origin_city_id,
			destinationCityId: row.destination_city_id,
			weight: Number.parseFloat(row.weight),
			length: Number.parseFloat(row.length),
			width: Number.parseFloat(row.width),
			height: Number.parseFloat(row.height),
			volumetricWeight: Number.parseFloat(row.volumetric_weight),
			chargeableWeight: Number.parseFloat(row.chargeable_weight),
			totalPrice: Number.parseFloat(row.total_price),
			status: row.status,
			expiresAt: row.expires_at,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}
}

