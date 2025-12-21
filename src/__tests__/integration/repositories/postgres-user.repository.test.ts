import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Pool } from "pg";
import {
	startPostgresContainer,
	stopPostgresContainer,
	getTestPool,
	cleanDatabase,
} from "../../setup/containers/postgres.setup.js";
import { PostgresUserRepository } from "@infrastructure/persistence/postgres-user.repository.js";
import type { CreateUserData } from "@domain/user/user.entity.js";

describe("PostgresUserRepository", () => {
	let pool: Pool;
	let repository: PostgresUserRepository;

	beforeAll(async () => {
		await startPostgresContainer();
		pool = getTestPool();
		repository = new PostgresUserRepository(pool);
	});

	afterAll(async () => {
		await stopPostgresContainer();
	});

	beforeEach(async () => {
		await cleanDatabase();
	});

	const createValidUserData = (): CreateUserData => ({
		email: "test@example.com",
		password: "hashedPassword123",
		name: "Test User",
	});

	describe("create", () => {
		it("should create a user and return it with generated ID", async () => {
			const userData = createValidUserData();

			const result = await repository.create(userData);

			expect(result.id).toBeDefined();
			expect(result.id).toBeGreaterThan(0);
			expect(result.email).toBe("test@example.com");
			expect(result.name).toBe("Test User");
			expect(result.password).toBe("hashedPassword123");
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it("should reject duplicate emails due to unique constraint", async () => {
			const userData = createValidUserData();
			await repository.create(userData);

			await expect(repository.create(userData)).rejects.toThrow();
		});
	});

	describe("findByEmail", () => {
		it("should find an existing user by email", async () => {
			await repository.create(createValidUserData());

			const found = await repository.findByEmail("test@example.com");

			expect(found).not.toBeNull();
			expect(found?.email).toBe("test@example.com");
			expect(found?.name).toBe("Test User");
		});

		it("should return null for non-existent email", async () => {
			const result = await repository.findByEmail("nonexistent@example.com");

			expect(result).toBeNull();
		});

		it("should be case-sensitive for email lookup", async () => {
			await repository.create(createValidUserData());

			// PostgreSQL is case-sensitive by default
			const result = await repository.findByEmail("TEST@EXAMPLE.COM");

			expect(result).toBeNull();
		});
	});

	describe("findById", () => {
		it("should find an existing user by ID", async () => {
			const created = await repository.create(createValidUserData());

			const found = await repository.findById(created.id);

			expect(found).not.toBeNull();
			expect(found?.id).toBe(created.id);
			expect(found?.email).toBe("test@example.com");
		});

		it("should return null for non-existent ID", async () => {
			const result = await repository.findById(99999);

			expect(result).toBeNull();
		});
	});

	describe("data mapping", () => {
		it("should correctly map snake_case to camelCase", async () => {
			const created = await repository.create(createValidUserData());

			expect(created.createdAt).toBeDefined();
			expect(created.updatedAt).toBeDefined();
			expect(
				(created as unknown as Record<string, unknown>).created_at,
			).toBeUndefined();
			expect(
				(created as unknown as Record<string, unknown>).updated_at,
			).toBeUndefined();
		});
	});
});
