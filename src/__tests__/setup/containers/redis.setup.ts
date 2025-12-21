import {
	RedisContainer,
	type StartedRedisContainer,
} from "@testcontainers/redis";
import { Redis } from "ioredis";

let container: StartedRedisContainer | null = null;
let redis: Redis | null = null;

/**
 * Starts the Redis container.
 * Call this in beforeAll().
 */
export async function startRedisContainer(): Promise<void> {
	container = await new RedisContainer("redis:7-alpine").start();

	redis = new Redis({
		host: container.getHost(),
		port: container.getPort(),
	});
}

/**
 * Stops the Redis container and closes the connection.
 * Call this in afterAll().
 */
export async function stopRedisContainer(): Promise<void> {
	if (redis) {
		await redis.quit();
		redis = null;
	}
	if (container) {
		await container.stop();
		container = null;
	}
}

/**
 * Returns the test Redis instance.
 * Throws if container is not started.
 */
export function getTestRedis(): Redis {
	if (!redis) {
		throw new Error(
			"Redis container not started. Call startRedisContainer() first.",
		);
	}
	return redis;
}

/**
 * Clears all keys from Redis.
 * Call this in beforeEach() to ensure test isolation.
 */
export async function cleanRedis(): Promise<void> {
	if (!redis) return;
	await redis.flushall();
}
