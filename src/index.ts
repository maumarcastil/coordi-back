import { loadEnvConfig } from "@infrastructure/config/env.config.js";
import {
	connectDatabase,
	disconnectDatabase,
} from "@infrastructure/database/pool.js";
import { createServer } from "@infrastructure/http/Server.js";

const config = loadEnvConfig();
const server = await createServer();

// Routes
server.get("/health", () => {
	return { status: "ok" };
});

// Graceful shutdown
const shutdown = async () => {
	server.log.info("Shutting down server...");
	await disconnectDatabase();
	await server.close();
	process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start
try {
	await connectDatabase();
	server.log.info("Database connected");

	await server.listen({
		port: config.port,
		host: config.host,
	});
} catch (err) {
	server.log.error(err);
	process.exit(1);
}
