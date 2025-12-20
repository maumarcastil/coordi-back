import type { Order } from "@domain/order/order.entity.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";

export class GetUserOrdersUseCase {
	constructor(private readonly orderRepository: IOrderRepository) {}

	async execute(userId: number): Promise<Order[]> {
		return this.orderRepository.findByUserId(userId);
	}
}

