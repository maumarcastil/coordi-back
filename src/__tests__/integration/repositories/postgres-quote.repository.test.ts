import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Pool } from "pg";
import {
	startPostgresContainer,
	stopPostgresContainer,
	getTestPool,
	cleanDatabase,
} from "../../setup/containers/postgres.setup.js";
import { PostgresQuoteRepository } from "@infrastructure/persistence/postgres-quote.repository.js";
import type { CreateQuoteData } from "@domain/quote/quote.entity.js";

describe("PostgresQuoteRepository", () => {
	let pool: Pool;
	let repository: PostgresQuoteRepository;

	let testUserId: number;
	let testOriginCityId: number;
	let testDestinationCityId: number;

	beforeAll(async () => {
		await startPostgresContainer();
		pool = getTestPool();
		repository = new PostgresQuoteRepository(pool);
	});

	afterAll(async () => {
		await stopPostgresContainer();
	});

	beforeEach(async () => {
		await cleanDatabase();

		// Insert test user
		const userResult = await pool.query<{ id: number }>(
			"INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id",
			["test@example.com", "hashedpassword", "Test User"],
		);
		testUserId = userResult.rows[0].id;

		// Get cities from seed data
		const citiesResult = await pool.query<{ id: number }>(
			"SELECT id FROM cities ORDER BY id LIMIT 2",
		);
		testOriginCityId = citiesResult.rows[0].id;
		testDestinationCityId = citiesResult.rows[1].id;
	});

	const createValidQuoteData = (): CreateQuoteData => ({
		userId: testUserId,
		originCityId: testOriginCityId,
		destinationCityId: testDestinationCityId,
		weight: 5.5,
		length: 30,
		width: 20,
		height: 15,
		volumetricWeight: 1.8,
		chargeableWeight: 5.5,
		totalPrice: 27500,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	});

	describe("create", () => {
		it("should create a quote with default pending status", async () => {
			const quoteData = createValidQuoteData();

			const result = await repository.create(quoteData);

			expect(result.id).toBeDefined();
			expect(result.userId).toBe(testUserId);
			expect(result.status).toBe("pending");
			expect(result.totalPrice).toBe(27500);
		});

		it("should correctly map decimal fields", async () => {
			const quoteData = createValidQuoteData();

			const result = await repository.create(quoteData);

			expect(typeof result.weight).toBe("number");
			expect(result.weight).toBe(5.5);
			expect(result.volumetricWeight).toBe(1.8);
		});
	});

	describe("findById", () => {
		it("should find an existing quote", async () => {
			const created = await repository.create(createValidQuoteData());

			const found = await repository.findById(created.id);

			expect(found).not.toBeNull();
			expect(found?.id).toBe(created.id);
		});

		it("should return null for non-existent quote", async () => {
			const result = await repository.findById(99999);

			expect(result).toBeNull();
		});
	});

	describe("findByUserId", () => {
		it("should return all quotes for a user ordered by creation date DESC", async () => {
			await repository.create(createValidQuoteData());
			await repository.create({
				...createValidQuoteData(),
				weight: 10,
				totalPrice: 50000,
			});

			const quotes = await repository.findByUserId(testUserId);

			expect(quotes).toHaveLength(2);
			// Newest first
			expect(quotes[0].totalPrice).toBe(50000);
			expect(quotes[1].totalPrice).toBe(27500);
		});

		it("should return empty array for user with no quotes", async () => {
			const quotes = await repository.findByUserId(99999);

			expect(quotes).toEqual([]);
		});
	});

	describe("updateStatus", () => {
		it("should update quote status to converted", async () => {
			const created = await repository.create(createValidQuoteData());

			const updated = await repository.updateStatus(created.id, "converted");

			expect(updated.status).toBe("converted");
		});

		it("should update quote status to expired", async () => {
			const created = await repository.create(createValidQuoteData());

			const updated = await repository.updateStatus(created.id, "expired");

			expect(updated.status).toBe("expired");
		});

		it("should throw error for non-existent quote", async () => {
			await expect(repository.updateStatus(99999, "converted")).rejects.toThrow(
				"Cotización no encontrada",
			);
		});
	});
});
