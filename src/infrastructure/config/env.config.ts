export interface DatabaseEnvConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	name: string;
	maxConnections: number;
}

export interface EnvConfig {
	port: number;
	host: string;
	nodeEnv: "development" | "production";
	database: DatabaseEnvConfig;
}

export function loadEnvConfig(): EnvConfig {
	const nodeEnv =
		process.env.NODE_ENV === "production" ? "production" : "development";

	return {
		port: Number(process.env.PORT) || 3000,
		host: process.env.HOST || "0.0.0.0",
		nodeEnv,
		database: {
			host: process.env.DB_HOST || "localhost",
			port: Number(process.env.DB_PORT) || 5432,
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASSWORD || "",
			name: process.env.DB_NAME || "coordi",
			maxConnections: Number(process.env.DB_MAX_CONNECTIONS) || 10,
		},
	};
}

