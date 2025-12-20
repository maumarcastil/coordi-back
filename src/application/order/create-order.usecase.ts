import type { IOrderStatusHistoryRepository } from "@domain/order/order-status-history.repository.js";
import type { CreateOrderInput, Order } from "@domain/order/order.entity.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";

export class CreateOrderUseCase {
	constructor(
		private readonly orderRepository: IOrderRepository,
		private readonly quoteRepository: IQuoteRepository,
		private readonly statusHistoryRepository: IOrderStatusHistoryRepository,
	) {}

	async execute(userId: number, input: CreateOrderInput): Promise<Order> {
		const { quoteId } = input;

		// Buscar la cotización
		const quote = await this.quoteRepository.findById(quoteId);

		if (!quote) {
			throw new Error("Cotización no encontrada");
		}

		// Validar que la cotización pertenezca al usuario
		if (quote.userId !== userId) {
			throw new Error(
				"No tienes permiso para crear una orden con esta cotización",
			);
		}

		// Validar que la cotización esté pendiente
		if (quote.status !== "pending") {
			throw new Error("Esta cotización ya fue convertida o ha expirado");
		}

		// TODO: Descomentar cuando se implemente la lógica de expiración
		// Validar que la cotización no haya expirado
		// if (new Date() > quote.expiresAt) {
		// 	throw new Error("Esta cotización ha expirado");
		// }

		// Verificar que no exista ya una orden para esta cotización
		const existingOrder = await this.orderRepository.findByQuoteId(quoteId);
		if (existingOrder) {
			throw new Error("Ya existe una orden para esta cotización");
		}

		// Calcular fecha estimada de entrega (5 días hábiles)
		const estimatedDeliveryDate = this.calculateEstimatedDelivery();

		// Crear la orden
		const order = await this.orderRepository.create({
			quoteId: quote.id,
			userId,
			originCityId: quote.originCityId,
			destinationCityId: quote.destinationCityId,
			weight: quote.weight,
			length: quote.length,
			width: quote.width,
			height: quote.height,
			volumetricWeight: quote.volumetricWeight,
			chargeableWeight: quote.chargeableWeight,
			totalPrice: quote.totalPrice,
			trackingNumber: null,
			currentStatus: "pending",
			senderName: input.senderName,
			senderPhone: input.senderPhone,
			senderAddress: input.senderAddress,
			recipientName: input.recipientName,
			recipientPhone: input.recipientPhone,
			recipientAddress: input.recipientAddress,
			packageDescription: input.packageDescription || null,
			estimatedDeliveryDate,
		});

		// Crear el primer registro en el historial
		await this.statusHistoryRepository.create({
			orderId: order.id,
			status: "pending",
			notes: "Orden creada",
			changedBySystem: true,
		});

		return order;
	}

	private calculateEstimatedDelivery(): Date {
		const date = new Date();
		let businessDays = 5;

		while (businessDays > 0) {
			date.setDate(date.getDate() + 1);
			const dayOfWeek = date.getDay();
			if (dayOfWeek !== 0 && dayOfWeek !== 6) {
				businessDays--;
			}
		}

		return date;
	}
}
