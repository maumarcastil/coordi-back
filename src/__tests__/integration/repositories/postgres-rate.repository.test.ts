import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Pool } from "pg";
import {
	startPostgresContainer,
	stopPostgresContainer,
	getTestPool,
} from "../../setup/containers/postgres.setup.js";
import { PostgresRateRepository } from "@infrastructure/persistence/postgres-rate.repository.js";

describe("PostgresRateRepository", () => {
	let pool: Pool;
	let repository: PostgresRateRepository;

	// City IDs from seed data:
	// 1: Bogotá, 2: Medellín, 3: Cali, 4: Barranquilla, 5: Cartagena
	const BOGOTA_ID = 1;
	const MEDELLIN_ID = 2;
	const CALI_ID = 3;
	const BARRANQUILLA_ID = 4;
	const CARTAGENA_ID = 5;

	beforeAll(async () => {
		await startPostgresContainer();
		pool = getTestPool();
		repository = new PostgresRateRepository(pool);
	});

	afterAll(async () => {
		await stopPostgresContainer();
	});

	// Note: No beforeEach/cleanDatabase needed since shipping_rates is seed data
	// and this repository only reads, never writes

	describe("findByPair", () => {
		it("should find an existing rate between two cities", async () => {
			const rate = await repository.findByPair(BOGOTA_ID, MEDELLIN_ID);

			expect(rate).not.toBeNull();
			expect(rate?.cityAId).toBe(BOGOTA_ID);
			expect(rate?.cityBId).toBe(MEDELLIN_ID);
			expect(rate?.isActive).toBe(true);
		});

		it("should correctly map decimal fields from database", async () => {
			const rate = await repository.findByPair(BOGOTA_ID, MEDELLIN_ID);

			expect(rate).not.toBeNull();
			// Bogotá - Medellín: base_price 15000.00, price_per_kg 2500.00
			expect(typeof rate?.basePrice).toBe("number");
			expect(typeof rate?.pricePerKg).toBe("number");
			expect(rate?.basePrice).toBe(15000);
			expect(rate?.pricePerKg).toBe(2500);
		});

		it("should correctly map distanceKm field", async () => {
			const rate = await repository.findByPair(BOGOTA_ID, MEDELLIN_ID);

			expect(rate).not.toBeNull();
			// Bogotá - Medellín: distance_km 415
			expect(rate?.distanceKm).toBe(415);
		});

		it("should return the same rate regardless of city order (symmetry)", async () => {
			// Query with Bogotá first
			const rate1 = await repository.findByPair(BOGOTA_ID, MEDELLIN_ID);
			// Query with Medellín first (inverted order)
			const rate2 = await repository.findByPair(MEDELLIN_ID, BOGOTA_ID);

			expect(rate1).not.toBeNull();
			expect(rate2).not.toBeNull();
			expect(rate1?.id).toBe(rate2?.id);
			expect(rate1?.basePrice).toBe(rate2?.basePrice);
			expect(rate1?.pricePerKg).toBe(rate2?.pricePerKg);
		});

		it("should return null for non-existent city pair", async () => {
			// Use non-existent city IDs
			const rate = await repository.findByPair(999, 1000);

			expect(rate).toBeNull();
		});

		it("should find rate between distant cities", async () => {
			// Barranquilla - Cartagena (shortest distance in seed data)
			const rate = await repository.findByPair(BARRANQUILLA_ID, CARTAGENA_ID);

			expect(rate).not.toBeNull();
			expect(rate?.basePrice).toBe(5000);
			expect(rate?.pricePerKg).toBe(1200);
			expect(rate?.distanceKm).toBe(130);
		});

		it("should find rate between Cali and other cities", async () => {
			// Cali - Barranquilla
			const rate = await repository.findByPair(CALI_ID, BARRANQUILLA_ID);

			expect(rate).not.toBeNull();
			expect(rate?.basePrice).toBe(22000);
			expect(rate?.pricePerKg).toBe(3000);
			expect(rate?.distanceKm).toBe(950);
		});
	});
});

