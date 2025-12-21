import type { OrderListItem } from "@domain/order/order.entity.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";

export class GetUserOrdersUseCase {
	constructor(private readonly orderRepository: IOrderRepository) {}

	async execute(userId: number): Promise<OrderListItem[]> {
		return this.orderRepository.findAllByUserId(userId);
	}
}
