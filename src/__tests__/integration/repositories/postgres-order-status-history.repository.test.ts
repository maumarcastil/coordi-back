import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Pool } from "pg";
import {
	startPostgresContainer,
	stopPostgresContainer,
	getTestPool,
	cleanDatabase,
} from "../../setup/containers/postgres.setup.js";
import { PostgresOrderStatusHistoryRepository } from "@infrastructure/persistence/postgres-order-status-history.repository.js";
import type { CreateStatusHistoryData } from "@domain/order/order-status-history.entity.js";

describe("PostgresOrderStatusHistoryRepository", () => {
	let pool: Pool;
	let repository: PostgresOrderStatusHistoryRepository;

	// Test data IDs
	let testUserId: number;
	let testOrderId: string;
	let testOriginCityId: number;
	let testDestinationCityId: number;

	beforeAll(async () => {
		await startPostgresContainer();
		pool = getTestPool();
		repository = new PostgresOrderStatusHistoryRepository(pool);
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

		// Insert test quote
		const quoteResult = await pool.query<{ id: number }>(
			`INSERT INTO quotes (
				user_id, origin_city_id, destination_city_id,
				weight, length, width, height,
				volumetric_weight, chargeable_weight, total_price,
				status, expires_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
			[
				testUserId,
				testOriginCityId,
				testDestinationCityId,
				5.0,
				30,
				20,
				15,
				1.8,
				5.0,
				25000,
				"pending",
				new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			],
		);

		// Insert test order
		const orderResult = await pool.query<{ id: string }>(
			`INSERT INTO orders (
				quote_id, user_id, origin_city_id, destination_city_id,
				weight, length, width, height,
				volumetric_weight, chargeable_weight, total_price,
				current_status, sender_name, sender_phone, sender_address,
				recipient_name, recipient_phone, recipient_address,
				package_description, estimated_delivery_date
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
			RETURNING id`,
			[
				quoteResult.rows[0].id,
				testUserId,
				testOriginCityId,
				testDestinationCityId,
				5.0,
				30,
				20,
				15,
				1.8,
				5.0,
				25000,
				"pending",
				"John Doe",
				"3001234567",
				"Calle 123 #45-67",
				"Jane Doe",
				"3009876543",
				"Carrera 456 #78-90",
				"Fragile items",
				new Date("2025-01-15"),
			],
		);
		testOrderId = orderResult.rows[0].id;
	});

	const createValidHistoryData = (): CreateStatusHistoryData => ({
		orderId: testOrderId,
		status: "confirmed",
		notes: "Order confirmed by admin",
		location: "Bogotá - Centro de distribución",
		changedByUserId: testUserId,
		changedBySystem: false,
	});

	describe("create", () => {
		it("should create a status history entry and return it with generated UUID", async () => {
			const historyData = createValidHistoryData();

			const result = await repository.create(historyData);

			expect(result.id).toBeDefined();
			expect(result.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
			expect(result.orderId).toBe(testOrderId);
			expect(result.status).toBe("confirmed");
			expect(result.createdAt).toBeInstanceOf(Date);
		});

		it("should correctly map all optional fields", async () => {
			const historyData = createValidHistoryData();

			const result = await repository.create(historyData);

			expect(result.notes).toBe("Order confirmed by admin");
			expect(result.location).toBe("Bogotá - Centro de distribución");
			expect(result.changedByUserId).toBe(testUserId);
			expect(result.changedBySystem).toBe(false);
		});

		it("should create entry with null optional fields", async () => {
			const historyData: CreateStatusHistoryData = {
				orderId: testOrderId,
				status: "in_transit",
			};

			const result = await repository.create(historyData);

			expect(result.notes).toBeNull();
			expect(result.location).toBeNull();
			expect(result.changedByUserId).toBeNull();
			expect(result.changedBySystem).toBe(false);
		});

		it("should create entry with changedBySystem true", async () => {
			const historyData: CreateStatusHistoryData = {
				orderId: testOrderId,
				status: "in_transit",
				changedBySystem: true,
			};

			const result = await repository.create(historyData);

			expect(result.changedBySystem).toBe(true);
			expect(result.changedByUserId).toBeNull();
		});
	});

	describe("findByOrderId", () => {
		it("should return history entries ordered by creation date ASC", async () => {
			// Create multiple history entries
			await repository.create({
				orderId: testOrderId,
				status: "pending",
				notes: "Order created",
			});

			await repository.create({
				orderId: testOrderId,
				status: "confirmed",
				notes: "Order confirmed",
			});

			await repository.create({
				orderId: testOrderId,
				status: "in_transit",
				notes: "Order shipped",
			});

			const history = await repository.findByOrderId(testOrderId);

			expect(history).toHaveLength(3);
			// Should be ordered by created_at ASC (oldest first)
			expect(history[0].status).toBe("pending");
			expect(history[1].status).toBe("confirmed");
			expect(history[2].status).toBe("in_transit");
		});

		it("should return empty array for order with no history", async () => {
			const history = await repository.findByOrderId(
				"00000000-0000-0000-0000-000000000000",
			);

			expect(history).toEqual([]);
		});

		it("should only return history for the specified order", async () => {
			// Create history for test order
			await repository.create({
				orderId: testOrderId,
				status: "confirmed",
			});

			// Create another order
			const quoteResult = await pool.query<{ id: number }>(
				`INSERT INTO quotes (
					user_id, origin_city_id, destination_city_id,
					weight, length, width, height,
					volumetric_weight, chargeable_weight, total_price,
					status, expires_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
				[
					testUserId,
					testOriginCityId,
					testDestinationCityId,
					10.0,
					40,
					30,
					20,
					4.8,
					10.0,
					50000,
					"pending",
					new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				],
			);

			const otherOrderResult = await pool.query<{ id: string }>(
				`INSERT INTO orders (
					quote_id, user_id, origin_city_id, destination_city_id,
					weight, length, width, height,
					volumetric_weight, chargeable_weight, total_price,
					current_status, sender_name, sender_phone, sender_address,
					recipient_name, recipient_phone, recipient_address,
					package_description, estimated_delivery_date
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
				RETURNING id`,
				[
					quoteResult.rows[0].id,
					testUserId,
					testOriginCityId,
					testDestinationCityId,
					10.0,
					40,
					30,
					20,
					4.8,
					10.0,
					50000,
					"pending",
					"Other Sender",
					"3001111111",
					"Other Address",
					"Other Recipient",
					"3002222222",
					"Other Destination",
					"Other package",
					new Date("2025-01-20"),
				],
			);

			// Create history for other order
			await repository.create({
				orderId: otherOrderResult.rows[0].id,
				status: "in_transit",
			});

			// Query history for first order only
			const history = await repository.findByOrderId(testOrderId);

			expect(history).toHaveLength(1);
			expect(history[0].orderId).toBe(testOrderId);
			expect(history[0].status).toBe("confirmed");
		});
	});
});

