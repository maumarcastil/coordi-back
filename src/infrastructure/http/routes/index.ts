import type { FastifyInstance } from "fastify";
import { userRoutes } from "./user.routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
	await app.register(userRoutes);
}
