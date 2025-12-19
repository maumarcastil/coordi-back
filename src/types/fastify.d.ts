import type { PostgresDb } from "@fastify/postgres";

declare module "fastify" {
	interface FastifyInstance {
		pg: PostgresDb;
	}
}
