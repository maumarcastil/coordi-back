import type { OrderDetail } from "@domain/order/order.entity.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";

export class GetOrderByIdUseCase {
	constructor(private readonly orderRepository: IOrderRepository) {}

	async execute(orderId: string, userId: number): Promise<OrderDetail> {
		const order = await this.orderRepository.findByIdWithCityDetails(orderId);

		if (!order) {
			throw new Error("Orden no encontrada");
		}

		// Validar que la orden pertenezca al usuario
		if (order.userId !== userId) {
			throw new Error("No tienes permiso para ver esta orden");
		}

		return order;
	}
}
