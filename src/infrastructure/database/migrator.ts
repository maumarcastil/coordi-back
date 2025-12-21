import Postgrator from "postgrator";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@infrastructure/config/env.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
	const config = loadEnvConfig();

	const client = new pg.Client({
		host: config.database.host,
		port: config.database.port,
		user: config.database.user,
		password: config.database.password,
		database: config.database.name,
	});

	await client.connect();

	const postgrator = new Postgrator({
		migrationPattern: path.join(__dirname, "migrations/*"),
		driver: "pg",
		database: config.database.name,
		schemaTable: "schemaversion",
		execQuery: (query) => client.query(query),
	});

	try {
		const migrations = await postgrator.migrate();

		if (migrations.length > 0) {
			console.log(`✓ ${migrations.length} migración(es) ejecutada(s)`);
			for (const migration of migrations) {
				console.log(`  - ${migration.name}`);
			}
		}
	} finally {
		await client.end();
	}
}
