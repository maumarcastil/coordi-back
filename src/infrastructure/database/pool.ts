import pg from "pg";
import { loadEnvConfig } from "@infrastructure/config/env.config.js";

const config = loadEnvConfig();

/**
 * Pool de conexiones para uso en scripts CLI (migrator, seeds, etc.)
 * La aplicación principal usa @fastify/postgres en su lugar.
 */
export const pool = new pg.Pool({
	host: config.database.host,
	port: config.database.port,
	user: config.database.user,
	password: config.database.password,
	database: config.database.name,
	max: config.database.maxConnections,
});
