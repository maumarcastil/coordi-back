import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

export interface MigrationRecord {
	id: number;
	name: string;
	executed_at: Date;
}

export async function ensureMigrationsTable(): Promise<void> {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS migrations (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) UNIQUE NOT NULL,
			executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`);
}

export async function getExecutedMigrations(): Promise<string[]> {
	const result = await pool.query<MigrationRecord>(
		"SELECT name FROM migrations ORDER BY name",
	);
	return result.rows.map((row) => row.name);
}

export async function getPendingMigrations(): Promise<string[]> {
	const files = await fs.readdir(MIGRATIONS_DIR);
	const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

	const executed = await getExecutedMigrations();
	return sqlFiles.filter((file) => !executed.includes(file));
}

export async function runMigration(name: string): Promise<void> {
	const filePath = path.join(MIGRATIONS_DIR, name);
	const sql = await fs.readFile(filePath, "utf-8");

	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		await client.query(sql);
		await client.query("INSERT INTO migrations (name) VALUES ($1)", [name]);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export interface MigrationResult {
	executed: string[];
	total: number;
}

export async function runAllPending(): Promise<MigrationResult> {
	await ensureMigrationsTable();

	const pending = await getPendingMigrations();
	const executed: string[] = [];

	for (const migration of pending) {
		await runMigration(migration);
		executed.push(migration);
	}

	return {
		executed,
		total: executed.length,
	};
}
