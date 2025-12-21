export interface DatabaseEnvConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	name: string;
	maxConnections: number;
}

export interface RedisEnvConfig {
	host: string;
	port: number;
	password?: string;
}

export interface EnvConfig {
	port: number;
	host: string;
	nodeEnv: "development" | "production";
	database: DatabaseEnvConfig;
	redis: RedisEnvConfig;
	jwtSecret: string;
	jwtExpiresIn: string;
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
		redis: {
			host: process.env.REDIS_HOST || "localhost",
			port: Number(process.env.REDIS_PORT) || 6379,
			password: process.env.REDIS_PASSWORD || undefined,
		},
		jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
		jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
	};
}
