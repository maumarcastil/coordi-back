import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetOrderByIdUseCase } from "../get-order-by-id.usecase.js";
import {
	createMockOrderRepository,
	createTestOrderDetail,
} from "@test/mocks/index.js";

describe("GetOrderByIdUseCase", () => {
	let useCase: GetOrderByIdUseCase;
	let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockOrderRepository = createMockOrderRepository();
		useCase = new GetOrderByIdUseCase(mockOrderRepository);
	});

	describe("Security: Authorization", () => {
		it("should prevent users from accessing orders they do not own", async () => {
			const order = createTestOrderDetail({ userId: 100 });
			vi.mocked(mockOrderRepository.findByIdWithCityDetails).mockResolvedValue(
				order,
			);

			const differentUserId = 999;

			await expect(
				useCase.execute("order-uuid-123", differentUserId),
			).rejects.toThrow("No tienes permiso para ver esta orden");
		});
	});
});
