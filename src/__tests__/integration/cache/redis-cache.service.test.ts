import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Redis } from "ioredis";
import {
	startRedisContainer,
	stopRedisContainer,
	getTestRedis,
	cleanRedis,
} from "../../setup/containers/redis.setup.js";
import { RedisCacheService } from "@infrastructure/cache/redis-cache.service.js";

describe("RedisCacheService", () => {
	let redis: Redis;
	let cacheService: RedisCacheService;

	beforeAll(async () => {
		await startRedisContainer();
		redis = getTestRedis();
		cacheService = new RedisCacheService(redis);
	});

	afterAll(async () => {
		await stopRedisContainer();
	});

	beforeEach(async () => {
		await cleanRedis();
	});

	describe("set and get", () => {
		it("should store and retrieve a string value", async () => {
			await cacheService.set("test:string", "hello world");

			const result = await cacheService.get<string>("test:string");

			expect(result).toBe("hello world");
		});

		it("should store and retrieve an object", async () => {
			const data = { id: 1, name: "Test", active: true };

			await cacheService.set("test:object", data);

			const result = await cacheService.get<typeof data>("test:object");

			expect(result).toEqual(data);
		});

		it("should store and retrieve a complex nested object", async () => {
			const data = {
				user: { id: 1, name: "John" },
				items: [{ id: 1, price: 100 }, { id: 2, price: 200 }],
				metadata: { createdAt: "2025-01-01", tags: ["a", "b"] },
			};

			await cacheService.set("test:nested", data);

			const result = await cacheService.get<typeof data>("test:nested");

			expect(result).toEqual(data);
		});

		it("should return null for non-existent key", async () => {
			const result = await cacheService.get("non:existent:key");

			expect(result).toBeNull();
		});
	});

	describe("set with TTL", () => {
		it("should expire key after TTL", async () => {
			await cacheService.set("test:ttl", "expires soon", 1); // 1 second TTL

			// Should exist immediately
			const immediate = await cacheService.get("test:ttl");
			expect(immediate).toBe("expires soon");

			// Wait for expiration
			await new Promise((resolve) => setTimeout(resolve, 1100));

			const expired = await cacheService.get("test:ttl");
			expect(expired).toBeNull();
		});
	});

	describe("delete", () => {
		it("should delete an existing key", async () => {
			await cacheService.set("test:delete", "to be deleted");

			await cacheService.delete("test:delete");

			const result = await cacheService.get("test:delete");
			expect(result).toBeNull();
		});

		it("should not throw when deleting non-existent key", async () => {
			await expect(
				cacheService.delete("non:existent:key"),
			).resolves.not.toThrow();
		});
	});

	describe("deletePattern", () => {
		it("should delete all keys matching pattern", async () => {
			// Set multiple keys with same prefix
			await cacheService.set("rate:1:2", { price: 100 });
			await cacheService.set("rate:1:3", { price: 200 });
			await cacheService.set("rate:2:3", { price: 300 });
			await cacheService.set("other:key", "should remain");

			await cacheService.deletePattern("rate:*");

			// Rate keys should be deleted
			expect(await cacheService.get("rate:1:2")).toBeNull();
			expect(await cacheService.get("rate:1:3")).toBeNull();
			expect(await cacheService.get("rate:2:3")).toBeNull();

			// Other keys should remain
			expect(await cacheService.get("other:key")).toBe("should remain");
		});

		it("should handle pattern with no matching keys", async () => {
			await cacheService.set("existing:key", "value");

			await expect(
				cacheService.deletePattern("nonexistent:*"),
			).resolves.not.toThrow();

			// Original key should remain
			expect(await cacheService.get("existing:key")).toBe("value");
		});
	});

	describe("JSON serialization edge cases", () => {
		it("should handle arrays", async () => {
			const data = [1, 2, 3, 4, 5];

			await cacheService.set("test:array", data);

			const result = await cacheService.get<number[]>("test:array");
			expect(result).toEqual(data);
		});

		it("should handle null values in objects", async () => {
			const data = { name: "Test", value: null };

			await cacheService.set("test:null", data);

			const result = await cacheService.get<typeof data>("test:null");
			expect(result).toEqual(data);
		});

		it("should handle numeric values", async () => {
			await cacheService.set("test:number", 42.5);

			const result = await cacheService.get<number>("test:number");
			expect(result).toBe(42.5);
		});

		it("should handle boolean values", async () => {
			await cacheService.set("test:bool", true);

			const result = await cacheService.get<boolean>("test:bool");
			expect(result).toBe(true);
		});
	});
});

