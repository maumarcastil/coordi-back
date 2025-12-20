import type {
	CreateOrderData,
	Order,
	OrderListItem,
} from "./order.entity.js";

export interface IOrderRepository {
	create(data: CreateOrderData): Promise<Order>;
	findById(id: string): Promise<Order | null>;
	findByUserId(userId: number): Promise<Order[]>;
	findAllByUserId(userId: number): Promise<OrderListItem[]>;
	findByQuoteId(quoteId: number): Promise<Order | null>;
}

