import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Pool } from "pg";
import {
	startPostgresContainer,
	stopPostgresContainer,
	getTestPool,
	cleanDatabase,
} from "../../setup/containers/postgres.setup.js";
import { PostgresOrderRepository } from "@infrastructure/persistence/postgres-order.repository.js";
import type { CreateOrderData } from "@domain/order/order.entity.js";

describe("PostgresOrderRepository", () => {
	let pool: Pool;
	let repository: PostgresOrderRepository;

	// Test data IDs
	let testUserId: number;
	let testOriginCityId: number;
	let testDestinationCityId: number;
	let testQuoteId: number;

	beforeAll(async () => {
		await startPostgresContainer();
		pool = getTestPool();
		repository = new PostgresOrderRepository(pool);
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
		testQuoteId = quoteResult.rows[0].id;
	});

	const createValidOrderData = (): CreateOrderData => ({
		quoteId: testQuoteId,
		userId: testUserId,
		originCityId: testOriginCityId,
		destinationCityId: testDestinationCityId,
		weight: 5.0,
		length: 30,
		width: 20,
		height: 15,
		volumetricWeight: 1.8,
		chargeableWeight: 5.0,
		totalPrice: 25000,
		trackingNumber: null,
		currentStatus: "pending",
		senderName: "John Doe",
		senderPhone: "3001234567",
		senderAddress: "Calle 123 #45-67",
		recipientName: "Jane Doe",
		recipientPhone: "3009876543",
		recipientAddress: "Carrera 456 #78-90",
		packageDescription: "Fragile items",
		estimatedDeliveryDate: new Date("2025-01-15"),
	});

	describe("create", () => {
		it("should create an order and return it with generated UUID", async () => {
			const orderData = createValidOrderData();

			const result = await repository.create(orderData);

			expect(result.id).toBeDefined();
			expect(result.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
			expect(result.userId).toBe(testUserId);
			expect(result.quoteId).toBe(testQuoteId);
			expect(result.currentStatus).toBe("pending");
			expect(result.senderName).toBe("John Doe");
			expect(result.totalPrice).toBe(25000);
		});

		it("should correctly map decimal fields from database", async () => {
			const orderData = createValidOrderData();

			const result = await repository.create(orderData);

			expect(typeof result.weight).toBe("number");
			expect(typeof result.totalPrice).toBe("number");
			expect(result.weight).toBe(5.0);
			expect(result.volumetricWeight).toBe(1.8);
		});
	});

	describe("findById", () => {
		it("should find an existing order by UUID", async () => {
			const created = await repository.create(createValidOrderData());

			const found = await repository.findById(created.id);

			expect(found).not.toBeNull();
			expect(found?.id).toBe(created.id);
			expect(found?.senderName).toBe("John Doe");
		});

		it("should return null for non-existent order", async () => {
			const result = await repository.findById(
				"00000000-0000-0000-0000-000000000000",
			);

			expect(result).toBeNull();
		});
	});

	describe("findByIdWithCityDetails", () => {
		it("should return order with joined city information", async () => {
			const created = await repository.create(createValidOrderData());

			const result = await repository.findByIdWithCityDetails(created.id);

			expect(result).not.toBeNull();
			expect(result?.originCity).toBeDefined();
			expect(result?.originCity.name).toBe("Bogotá");
			expect(result?.originCity.department).toBe("Cundinamarca");
			expect(result?.destinationCity).toBeDefined();
			expect(result?.destinationCity.name).toBe("Medellín");
		});
	});

	describe("findByUserId", () => {
		it("should return all orders for a user ordered by creation date", async () => {
			await repository.create(createValidOrderData());

			// Create second quote and order
			const quote2Result = await pool.query<{ id: number }>(
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
			await repository.create({
				...createValidOrderData(),
				quoteId: quote2Result.rows[0].id,
				weight: 10.0,
				totalPrice: 50000,
			});

			const orders = await repository.findByUserId(testUserId);

			expect(orders).toHaveLength(2);
			// Should be ordered by created_at DESC (newest first)
			expect(orders[0].totalPrice).toBe(50000);
			expect(orders[1].totalPrice).toBe(25000);
		});

		it("should return empty array for user with no orders", async () => {
			const orders = await repository.findByUserId(99999);

			expect(orders).toEqual([]);
		});
	});

	describe("findByQuoteId", () => {
		it("should find order by quote ID", async () => {
			const created = await repository.create(createValidOrderData());

			const found = await repository.findByQuoteId(testQuoteId);

			expect(found).not.toBeNull();
			expect(found?.id).toBe(created.id);
		});

		it("should return null for quote without order", async () => {
			const result = await repository.findByQuoteId(99999);

			expect(result).toBeNull();
		});
	});

	describe("updateStatus", () => {
		it("should update order status and return updated order", async () => {
			const created = await repository.create(createValidOrderData());

			const updated = await repository.updateStatus(created.id, "confirmed");

			expect(updated).not.toBeNull();
			expect(updated?.currentStatus).toBe("confirmed");
			expect(updated?.updatedAt.getTime()).toBeGreaterThan(
				created.updatedAt.getTime(),
			);
		});

		it("should set delivered_at when status changes to delivered", async () => {
			const created = await repository.create(createValidOrderData());
			await repository.updateStatus(created.id, "confirmed");
			await repository.updateStatus(created.id, "in_transit");

			const delivered = await repository.updateStatus(created.id, "delivered");

			expect(delivered?.deliveredAt).not.toBeNull();
			expect(delivered?.deliveredAt).toBeInstanceOf(Date);
		});

		it("should set cancelled_at when status changes to cancelled", async () => {
			const created = await repository.create(createValidOrderData());

			const cancelled = await repository.updateStatus(created.id, "cancelled");

			expect(cancelled?.cancelledAt).not.toBeNull();
			expect(cancelled?.cancelledAt).toBeInstanceOf(Date);
		});

		it("should return null for non-existent order", async () => {
			const result = await repository.updateStatus(
				"00000000-0000-0000-0000-000000000000",
				"confirmed",
			);

			expect(result).toBeNull();
		});
	});

	describe("findAllByUserId", () => {
		it("should return orders with city names for listing", async () => {
			await repository.create(createValidOrderData());

			const orders = await repository.findAllByUserId(testUserId);

			expect(orders).toHaveLength(1);
			expect(orders[0].originCityName).toBe("Bogotá");
			expect(orders[0].destinationCityName).toBe("Medellín");
		});
	});
});
