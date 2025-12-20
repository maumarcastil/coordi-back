import type { CreateOrderData, Order } from "./order.entity.js";

export interface IOrderRepository {
	create(data: CreateOrderData): Promise<Order>;
	findById(id: string): Promise<Order | null>;
	findByUserId(userId: number): Promise<Order[]>;
	findByQuoteId(quoteId: number): Promise<Order | null>;
}

