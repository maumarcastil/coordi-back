import type { FastifyInstance } from "fastify";
import { cityRoutes } from "./city.routes.js";
import { userRoutes } from "./user.routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
	await app.register(userRoutes);
	await app.register(cityRoutes);
}
