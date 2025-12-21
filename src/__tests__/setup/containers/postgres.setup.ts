import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(
	__dirname,
	"../../../infrastructure/database/migrations",
);

let container: StartedPostgreSqlContainer | null = null;
let pool: Pool | null = null;

/**
 * Starts the PostgreSQL container and runs all migrations.
 * Call this in beforeAll().
 */
export async function startPostgresContainer(): Promise<void> {
	container = await new PostgreSqlContainer("postgres:16-alpine").start();

	pool = new Pool({
		connectionString: container.getConnectionUri(),
	});

	await runMigrations();
}

/**
 * Stops the PostgreSQL container and closes the pool.
 * Call this in afterAll().
 */
export async function stopPostgresContainer(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = null;
	}
	if (container) {
		await container.stop();
		container = null;
	}
}

/**
 * Returns the test pool instance.
 * Throws if container is not started.
 */
export function getTestPool(): Pool {
	if (!pool) {
		throw new Error(
			"PostgreSQL container not started. Call startPostgresContainer() first.",
		);
	}
	return pool;
}

/**
 * Cleans all data from tables while preserving the schema.
 * Call this in beforeEach() to ensure test isolation.
 */
export async function cleanDatabase(): Promise<void> {
	if (!pool) return;

	// Order matters due to foreign key constraints
	await pool.query(`
		TRUNCATE TABLE 
			order_status_history,
			orders,
			quotes,
			shipping_rates,
			cities,
			users
		CASCADE
	`);
}

/**
 * Runs all SQL migrations in order.
 */
async function runMigrations(): Promise<void> {
	if (!pool) return;

	const files = await fs.readdir(MIGRATIONS_DIR);
	const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

	for (const file of sqlFiles) {
		const filePath = path.join(MIGRATIONS_DIR, file);
		const sql = await fs.readFile(filePath, "utf-8");
		await pool.query(sql);
	}
}
