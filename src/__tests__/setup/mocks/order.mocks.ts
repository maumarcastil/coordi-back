import { vi } from "vitest";
import type { IOrderRepository } from "@domain/order/order.repository.js";
import type { IOrderStatusHistoryRepository } from "@domain/order/order-status-history.repository.js";
import type { Order, OrderDetail } from "@domain/order/order.entity.js";
import type { OrderStatusHistory } from "@domain/order/order-status-history.entity.js";

// Repository mocks
export const createMockOrderRepository = (): IOrderRepository => ({
	create: vi.fn(),
	findById: vi.fn(),
	findByIdWithCityDetails: vi.fn(),
	findByUserId: vi.fn(),
	findAllByUserId: vi.fn(),
	findByQuoteId: vi.fn(),
	updateStatus: vi.fn(),
});

export const createMockStatusHistoryRepository =
	(): IOrderStatusHistoryRepository => ({
		create: vi.fn(),
		findByOrderId: vi.fn(),
	});

// Entity factories
export const createTestOrder = (overrides: Partial<Order> = {}): Order => ({
	id: "order-uuid-123",
	quoteId: 1,
	userId: 100,
	originCityId: 1,
	destinationCityId: 2,
	weight: 10,
	length: 30,
	width: 20,
	height: 15,
	volumetricWeight: 4,
	chargeableWeight: 10,
	totalPrice: 15000,
	trackingNumber: null,
	currentStatus: "pending",
	senderName: "John Doe",
	senderPhone: "3001234567",
	senderAddress: "Calle 123",
	recipientName: "Jane Doe",
	recipientPhone: "3009876543",
	recipientAddress: "Carrera 456",
	packageDescription: null,
	estimatedDeliveryDate: new Date(),
	deliveredAt: null,
	cancelledAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

export const createTestOrderDetail = (
	overrides: Partial<OrderDetail> = {},
): OrderDetail => ({
	...createTestOrder(),
	originCity: {
		id: 1,
		name: "Bogotá",
		department: "Cundinamarca",
		code: "BOG",
	},
	destinationCity: {
		id: 2,
		name: "Medellín",
		department: "Antioquia",
		code: "MDE",
	},
	...overrides,
});

export const createTestStatusHistory = (
	overrides: Partial<OrderStatusHistory> = {},
): OrderStatusHistory => ({
	id: "history-uuid-123",
	orderId: "order-uuid-123",
	status: "pending",
	notes: null,
	location: null,
	changedByUserId: null,
	changedBySystem: true,
	createdAt: new Date(),
	...overrides,
});
