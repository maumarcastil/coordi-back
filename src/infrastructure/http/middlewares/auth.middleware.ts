import { type JwtPayload, verifyToken } from "@shared/utils/jwt.util.js";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
	interface FastifyRequest {
		user?: JwtPayload;
	}
}

export async function authMiddleware(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const authHeader = request.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return reply.status(401).send({
			error: "Token de autenticación requerido",
		});
	}

	const token = authHeader.substring(7);

	try {
		const payload = verifyToken(token);
		request.user = payload;
	} catch {
		return reply.status(401).send({
			error: "Token inválido o expirado",
		});
	}
}
