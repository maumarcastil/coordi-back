import pg from "pg";
import { loadEnvConfig } from "@infrastructure/config/env.config.js";

const config = loadEnvConfig();

export const pool = new pg.Pool({
	host: config.database.host,
	port: config.database.port,
	user: config.database.user,
	password: config.database.password,
	database: config.database.name,
	max: config.database.maxConnections,
});

export async function connectDatabase(): Promise<void> {
	const client = await pool.connect();
	client.release();
}

export async function disconnectDatabase(): Promise<void> {
	await pool.end();
}

