export interface EnvConfig {
	port: number;
	host: string;
	nodeEnv: "development" | "production";
}

export function loadEnvConfig(): EnvConfig {
	const nodeEnv =
		process.env.NODE_ENV === "production" ? "production" : "development";

	return {
		port: Number(process.env.PORT) || 3000,
		host: process.env.HOST || "0.0.0.0",
		nodeEnv,
	};
}




