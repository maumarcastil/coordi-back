import type { FastifyInstance } from "fastify";
import { verifyToken } from "@shared/utils/jwt.util.js";
import { connectionManager } from "./connection-manager.js";

export async function registerWebSocketRoutes(
	app: FastifyInstance,
): Promise<void> {
	app.get("/ws/orders", { websocket: true }, (socket, request) => {
		const url = new URL(request.url, `http://${request.headers.host}`);
		const token = url.searchParams.get("token");

		if (!token) {
			socket.send(
				JSON.stringify({
					event: "error",
					data: { message: "Token de autenticación requerido" },
				}),
			);
			socket.close(1008, "Token requerido");
			return;
		}

		let userId: number;

		try {
			const payload = verifyToken(token);
			userId = payload.userId;
		} catch {
			socket.send(
				JSON.stringify({
					event: "error",
					data: { message: "Token inválido o expirado" },
				}),
			);
			socket.close(1008, "Token inválido");
			return;
		}

		// Registrar la conexión
		connectionManager.registerConnection(userId, socket);

		// Enviar confirmación de conexión
		socket.send(
			JSON.stringify({
				event: "connected",
				data: {
					message: "Conexión establecida",
					userId,
				},
			}),
		);

		request.log.info(`WebSocket conectado: userId=${userId}`);

		// Manejar mensajes entrantes (ping/pong para mantener conexión)
		socket.on("message", (message: Buffer) => {
			try {
				const data = JSON.parse(message.toString());
				if (data.event === "ping") {
					socket.send(JSON.stringify({ event: "pong" }));
				}
			} catch {
				// Ignorar mensajes malformados
			}
		});

		// Limpiar al cerrar conexión
		socket.on("close", () => {
			connectionManager.removeConnection(userId, socket);
			request.log.info(`WebSocket desconectado: userId=${userId}`);
		});

		socket.on("error", (error: Error) => {
			request.log.error({ err: error }, `WebSocket error: userId=${userId}`);
			connectionManager.removeConnection(userId, socket);
		});
	});
}
