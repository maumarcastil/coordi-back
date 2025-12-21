import type { WebSocket } from "ws";

export interface OrderStatusChangedPayload {
	orderId: string;
	previousStatus: string;
	currentStatus: string;
	updatedAt: Date;
	statusHistory: {
		id: string;
		status: string;
		notes: string | null;
		location: string | null;
		createdAt: Date;
	};
}

export interface WebSocketMessage {
	event: string;
	data: unknown;
}

class ConnectionManager {
	private connections: Map<number, Set<WebSocket>> = new Map();

	registerConnection(userId: number, socket: WebSocket): void {
		if (!this.connections.has(userId)) {
			this.connections.set(userId, new Set());
		}
		this.connections.get(userId)?.add(socket);
	}

	removeConnection(userId: number, socket: WebSocket): void {
		const userConnections = this.connections.get(userId);
		if (userConnections) {
			userConnections.delete(socket);
			if (userConnections.size === 0) {
				this.connections.delete(userId);
			}
		}
	}

	notifyUser(userId: number, event: string, payload: unknown): void {
		const userConnections = this.connections.get(userId);
		if (!userConnections) {
			return;
		}

		const message: WebSocketMessage = {
			event,
			data: payload,
		};

		const messageStr = JSON.stringify(message);

		for (const socket of userConnections) {
			if (socket.readyState === socket.OPEN) {
				socket.send(messageStr);
			}
		}
	}

	notifyOrderStatusChanged(
		userId: number,
		payload: OrderStatusChangedPayload,
	): void {
		this.notifyUser(userId, "order_status_changed", payload);
	}

	getConnectionCount(userId: number): number {
		return this.connections.get(userId)?.size ?? 0;
	}

	getTotalConnections(): number {
		let total = 0;
		for (const connections of this.connections.values()) {
			total += connections.size;
		}
		return total;
	}
}

// Singleton instance
export const connectionManager = new ConnectionManager();
