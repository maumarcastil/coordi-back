import type { Redis } from "ioredis";

import type { ICacheService } from "@domain/cache/cache.service.js";

export class RedisCacheService implements ICacheService {
	constructor(private readonly redis: Redis) {}

	async get<T>(key: string): Promise<T | null> {
		const data = await this.redis.get(key);
		if (!data) return null;

		try {
			return JSON.parse(data) as T;
		} catch {
			return null;
		}
	}

	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		const serialized = JSON.stringify(value);

		if (ttlSeconds) {
			await this.redis.setex(key, ttlSeconds, serialized);
		} else {
			await this.redis.set(key, serialized);
		}
	}

	async delete(key: string): Promise<void> {
		await this.redis.del(key);
	}

	async deletePattern(pattern: string): Promise<void> {
		const keys = await this.redis.keys(pattern);
		if (keys.length > 0) {
			await this.redis.del(...keys);
		}
	}
}
