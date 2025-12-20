import type { Order, OrderStatus } from "@domain/order/order.entity.js";
import type { OrderStatusHistory } from "@domain/order/order-status-history.entity.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";
import type { IOrderStatusHistoryRepository } from "@domain/order/order-status-history.repository.js";

export interface UpdateOrderStatusInput {
	status: OrderStatus;
	notes?: string;
	location?: string;
}

export interface UpdateOrderStatusResult {
	order: {
		id: string;
		currentStatus: OrderStatus;
		updatedAt: Date;
	};
	statusHistory: OrderStatusHistory;
}

export class UpdateOrderStatusUseCase {
	constructor(
		private readonly orderRepository: IOrderRepository,
		private readonly statusHistoryRepository: IOrderStatusHistoryRepository,
	) {}

	async execute(
		orderId: string,
		userId: number,
		input: UpdateOrderStatusInput,
	): Promise<UpdateOrderStatusResult> {
		// Verificar que la orden existe
		const existingOrder = await this.orderRepository.findById(orderId);

		if (!existingOrder) {
			throw new Error("Orden no encontrada");
		}

		// Validar que el usuario tiene permiso (es el dueño de la orden)
		if (existingOrder.userId !== userId) {
			throw new Error("No tienes permiso para modificar esta orden");
		}

		// Validar que el estado actual no sea igual al nuevo
		if (existingOrder.currentStatus === input.status) {
			throw new Error(`La orden ya se encuentra en estado "${input.status}"`);
		}

		// Validar transiciones de estado válidas
		this.validateStatusTransition(existingOrder.currentStatus, input.status);

		// Actualizar el estado de la orden
		const updatedOrder = await this.orderRepository.updateStatus(
			orderId,
			input.status,
		);

		if (!updatedOrder) {
			throw new Error("Error al actualizar el estado de la orden");
		}

		// Registrar en el historial de estados
		const statusHistory = await this.statusHistoryRepository.create({
			orderId,
			status: input.status,
			notes: input.notes,
			location: input.location,
			changedByUserId: userId,
			changedBySystem: false,
		});

		return {
			order: {
				id: updatedOrder.id,
				currentStatus: updatedOrder.currentStatus,
				updatedAt: updatedOrder.updatedAt,
			},
			statusHistory,
		};
	}

	private validateStatusTransition(
		currentStatus: OrderStatus,
		newStatus: OrderStatus,
	): void {
		// Definir transiciones válidas
		const validTransitions: Record<OrderStatus, OrderStatus[]> = {
			pending: ["confirmed", "cancelled"],
			confirmed: ["in_transit", "cancelled"],
			in_transit: ["delivered", "cancelled"],
			delivered: [], // Estado final
			cancelled: [], // Estado final
		};

		const allowedTransitions = validTransitions[currentStatus];

		if (!allowedTransitions.includes(newStatus)) {
			throw new Error(
				`No se puede cambiar de "${currentStatus}" a "${newStatus}". ` +
					`Transiciones válidas: ${allowedTransitions.join(", ") || "ninguna (estado final)"}`,
			);
		}
	}
}
