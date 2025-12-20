import type {
	CreateOrderData,
	Order,
	OrderDetail,
	OrderListItem,
	OrderStatus,
} from "./order.entity.js";

export interface IOrderRepository {
	create(data: CreateOrderData): Promise<Order>;
	findById(id: string): Promise<Order | null>;
	findByIdWithCityDetails(id: string): Promise<OrderDetail | null>;
	findByUserId(userId: number): Promise<Order[]>;
	findAllByUserId(userId: number): Promise<OrderListItem[]>;
	findByQuoteId(quoteId: number): Promise<Order | null>;
	updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}
