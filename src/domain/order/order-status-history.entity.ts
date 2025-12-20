import type { OrderStatus } from "./order.entity.js";

export interface OrderStatusHistory {
	id: string;
	orderId: string;
	status: OrderStatus;
	notes: string | null;
	location: string | null;
	changedByUserId: number | null;
	changedBySystem: boolean;
	createdAt: Date;
}

export interface CreateStatusHistoryData {
	orderId: string;
	status: OrderStatus;
	notes?: string;
	location?: string;
	changedByUserId?: number;
	changedBySystem?: boolean;
}

