import { runAllPending } from "../src/infrastructure/database/migrator.js";
import { disconnectDatabase } from "../src/infrastructure/database/pool.js";

async function main() {
	console.log("🚀 Iniciando migraciones...\n");

	try {
		const result = await runAllPending();

		if (result.total === 0) {
			console.log("✓ No hay migraciones pendientes\n");
		} else {
			for (const migration of result.executed) {
				console.log(`✓ ${migration} ejecutada`);
			}
			console.log(`\n✓ ${result.total} migración(es) completada(s)\n`);
		}

		await disconnectDatabase();
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Error ejecutando migraciones:");
		console.error(error instanceof Error ? error.message : error);
		await disconnectDatabase();
		process.exit(1);
	}
}

main();
