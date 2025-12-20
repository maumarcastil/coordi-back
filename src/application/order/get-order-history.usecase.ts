import type { OrderStatusHistory } from "@domain/order/order-status-history.entity.js";
import type { IOrderStatusHistoryRepository } from "@domain/order/order-status-history.repository.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";

export class GetOrderHistoryUseCase {
	constructor(
		private readonly orderRepository: IOrderRepository,
		private readonly statusHistoryRepository: IOrderStatusHistoryRepository,
	) {}

	async execute(
		orderId: string,
		userId: number,
	): Promise<OrderStatusHistory[]> {
		// Verificar que la orden existe y pertenece al usuario
		const order = await this.orderRepository.findById(orderId);

		if (!order) {
			throw new Error("Orden no encontrada");
		}

		if (order.userId !== userId) {
			throw new Error("No tienes permiso para ver esta orden");
		}

		// Obtener historial ordenado cronológicamente
		return this.statusHistoryRepository.findByOrderId(orderId);
	}
}

