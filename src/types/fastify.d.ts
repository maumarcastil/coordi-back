import type { PostgresDb } from "@fastify/postgres";
import type { Redis } from "ioredis";

declare module "fastify" {
	interface FastifyInstance {
		pg: PostgresDb;
		redis: Redis;
	}
}
