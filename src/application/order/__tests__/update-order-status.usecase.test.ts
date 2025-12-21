import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateOrderStatusUseCase } from "../update-order-status.usecase.js";
import type { OrderStatus } from "@domain/order/order.entity.js";
import {
	createMockOrderRepository,
	createMockStatusHistoryRepository,
	createTestOrder,
	createTestStatusHistory,
} from "@test/mocks/index.js";

describe("UpdateOrderStatusUseCase", () => {
	let useCase: UpdateOrderStatusUseCase;
	let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
	let mockStatusHistoryRepository: ReturnType<
		typeof createMockStatusHistoryRepository
	>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockOrderRepository = createMockOrderRepository();
		mockStatusHistoryRepository = createMockStatusHistoryRepository();
		useCase = new UpdateOrderStatusUseCase(
			mockOrderRepository,
			mockStatusHistoryRepository,
		);

		vi.mocked(mockStatusHistoryRepository.create).mockResolvedValue(
			createTestStatusHistory({ status: "confirmed" }),
		);
	});

	describe("State Machine: Valid transitions", () => {
		it("should allow valid state transitions through the complete flow", async () => {
			const userId = 100;

			// Test: pending → confirmed
			vi.mocked(mockOrderRepository.findById).mockResolvedValue(
				createTestOrder({ currentStatus: "pending" }),
			);
			vi.mocked(mockOrderRepository.updateStatus).mockResolvedValue(
				createTestOrder({ currentStatus: "confirmed" }),
			);

			await expect(
				useCase.execute("order-uuid-123", userId, { status: "confirmed" }),
			).resolves.toBeDefined();

			// Test: confirmed → in_transit
			vi.clearAllMocks();
			vi.mocked(mockOrderRepository.findById).mockResolvedValue(
				createTestOrder({ currentStatus: "confirmed" }),
			);
			vi.mocked(mockOrderRepository.updateStatus).mockResolvedValue(
				createTestOrder({ currentStatus: "in_transit" }),
			);
			vi.mocked(mockStatusHistoryRepository.create).mockResolvedValue(
				createTestStatusHistory({ status: "in_transit" }),
			);

			await expect(
				useCase.execute("order-uuid-123", userId, { status: "in_transit" }),
			).resolves.toBeDefined();

			// Test: in_transit → delivered
			vi.clearAllMocks();
			vi.mocked(mockOrderRepository.findById).mockResolvedValue(
				createTestOrder({ currentStatus: "in_transit" }),
			);
			vi.mocked(mockOrderRepository.updateStatus).mockResolvedValue(
				createTestOrder({ currentStatus: "delivered" }),
			);
			vi.mocked(mockStatusHistoryRepository.create).mockResolvedValue(
				createTestStatusHistory({ status: "delivered" }),
			);

			await expect(
				useCase.execute("order-uuid-123", userId, { status: "delivered" }),
			).resolves.toBeDefined();
		});
	});

	describe("State Machine: Invalid transitions", () => {
		it("should reject invalid state transitions (skipping steps)", async () => {
			const userId = 100;

			vi.mocked(mockOrderRepository.findById).mockResolvedValue(
				createTestOrder({ currentStatus: "pending" }),
			);

			await expect(
				useCase.execute("order-uuid-123", userId, { status: "delivered" }),
			).rejects.toThrow('No se puede cambiar de "pending" a "delivered"');

			await expect(
				useCase.execute("order-uuid-123", userId, { status: "in_transit" }),
			).rejects.toThrow('No se puede cambiar de "pending" a "in_transit"');

			expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
		});
	});

	describe("State Machine: Final states", () => {
		it("should block any transitions from final states (delivered/cancelled)", async () => {
			const userId = 100;

			// Test: delivered → other states (excluding delivered itself)
			const statesFromDelivered: OrderStatus[] = [
				"pending",
				"confirmed",
				"in_transit",
				"cancelled",
			];

			for (const targetStatus of statesFromDelivered) {
				vi.clearAllMocks();
				vi.mocked(mockOrderRepository.findById).mockResolvedValue(
					createTestOrder({ currentStatus: "delivered" }),
				);

				await expect(
					useCase.execute("order-uuid-123", userId, { status: targetStatus }),
				).rejects.toThrow(/No se puede cambiar de "delivered"/);
			}

			// Test: cancelled → other states (excluding cancelled itself)
			const statesFromCancelled: OrderStatus[] = [
				"pending",
				"confirmed",
				"in_transit",
				"delivered",
			];

			for (const targetStatus of statesFromCancelled) {
				vi.clearAllMocks();
				vi.mocked(mockOrderRepository.findById).mockResolvedValue(
					createTestOrder({ currentStatus: "cancelled" }),
				);

				await expect(
					useCase.execute("order-uuid-123", userId, { status: targetStatus }),
				).rejects.toThrow(/No se puede cambiar de "cancelled"/);
			}
		});
	});
});
