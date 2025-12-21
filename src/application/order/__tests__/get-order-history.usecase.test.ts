import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetOrderHistoryUseCase } from "../get-order-history.usecase.js";
import {
	createMockOrderRepository,
	createMockStatusHistoryRepository,
	createTestOrder,
} from "@test/mocks/index.js";

describe("GetOrderHistoryUseCase", () => {
	let useCase: GetOrderHistoryUseCase;
	let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
	let mockStatusHistoryRepository: ReturnType<
		typeof createMockStatusHistoryRepository
	>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockOrderRepository = createMockOrderRepository();
		mockStatusHistoryRepository = createMockStatusHistoryRepository();
		useCase = new GetOrderHistoryUseCase(
			mockOrderRepository,
			mockStatusHistoryRepository,
		);
	});

	describe("Integrity: Order existence", () => {
		it("should reject when order does not exist", async () => {
			vi.mocked(mockOrderRepository.findById).mockResolvedValue(null);

			await expect(useCase.execute("non-existent-id", 100)).rejects.toThrow(
				"Orden no encontrada",
			);

			expect(mockStatusHistoryRepository.findByOrderId).not.toHaveBeenCalled();
		});
	});

	describe("Security: Authorization", () => {
		it("should prevent users from viewing history of orders they do not own", async () => {
			const order = createTestOrder({ userId: 100 });
			vi.mocked(mockOrderRepository.findById).mockResolvedValue(order);

			const differentUserId = 999;

			await expect(
				useCase.execute("order-uuid-123", differentUserId),
			).rejects.toThrow("No tienes permiso para ver esta orden");

			expect(mockStatusHistoryRepository.findByOrderId).not.toHaveBeenCalled();
		});
	});
});
