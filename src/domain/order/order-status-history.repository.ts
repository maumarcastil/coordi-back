import type {
	CreateStatusHistoryData,
	OrderStatusHistory,
} from "./order-status-history.entity.js";

export interface IOrderStatusHistoryRepository {
	create(data: CreateStatusHistoryData): Promise<OrderStatusHistory>;
	findByOrderId(orderId: string): Promise<OrderStatusHistory[]>;
}

