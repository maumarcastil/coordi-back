import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateOrderUseCase } from "../create-order.usecase.js";
import {
	createMockOrderRepository,
	createMockStatusHistoryRepository,
	createTestOrder,
} from "@test/mocks/index.js";
import {
	createMockQuoteRepository,
	createTestQuote,
} from "@test/mocks/index.js";

const validOrderInput = {
	quoteId: 1,
	senderName: "John Doe",
	senderPhone: "3001234567",
	senderAddress: "Calle 123",
	recipientName: "Jane Doe",
	recipientPhone: "3009876543",
	recipientAddress: "Carrera 456",
};

describe("CreateOrderUseCase", () => {
	let useCase: CreateOrderUseCase;
	let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
	let mockQuoteRepository: ReturnType<typeof createMockQuoteRepository>;
	let mockStatusHistoryRepository: ReturnType<
		typeof createMockStatusHistoryRepository
	>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockOrderRepository = createMockOrderRepository();
		mockQuoteRepository = createMockQuoteRepository();
		mockStatusHistoryRepository = createMockStatusHistoryRepository();
		useCase = new CreateOrderUseCase(
			mockOrderRepository,
			mockQuoteRepository,
			mockStatusHistoryRepository,
		);
	});

	describe("Integrity: Quote existence", () => {
		it("should reject when quote does not exist", async () => {
			vi.mocked(mockQuoteRepository.findById).mockResolvedValue(null);

			await expect(useCase.execute(100, validOrderInput)).rejects.toThrow(
				"Cotización no encontrada",
			);

			expect(mockOrderRepository.create).not.toHaveBeenCalled();
		});
	});

	describe("Security: Quote ownership", () => {
		it("should reject when user tries to create order from another user's quote", async () => {
			const quote = createTestQuote({ userId: 100 });
			vi.mocked(mockQuoteRepository.findById).mockResolvedValue(quote);

			const differentUserId = 999;

			await expect(
				useCase.execute(differentUserId, validOrderInput),
			).rejects.toThrow(
				"No tienes permiso para crear una orden con esta cotización",
			);

			expect(mockOrderRepository.create).not.toHaveBeenCalled();
		});
	});

	describe("Integrity: Quote status validation", () => {
		it("should reject when quote is not pending (already converted or expired)", async () => {
			const convertedQuote = createTestQuote({
				userId: 100,
				status: "converted",
			});
			vi.mocked(mockQuoteRepository.findById).mockResolvedValue(convertedQuote);

			await expect(useCase.execute(100, validOrderInput)).rejects.toThrow(
				"Esta cotización ya fue convertida o ha expirado",
			);

			expect(mockOrderRepository.create).not.toHaveBeenCalled();
		});
	});

	describe("Integrity: Duplicate order prevention", () => {
		it("should reject when order already exists for the quote", async () => {
			const quote = createTestQuote({ userId: 100, status: "pending" });
			const existingOrder = createTestOrder({ quoteId: 1 });

			vi.mocked(mockQuoteRepository.findById).mockResolvedValue(quote);
			vi.mocked(mockOrderRepository.findByQuoteId).mockResolvedValue(
				existingOrder,
			);

			await expect(useCase.execute(100, validOrderInput)).rejects.toThrow(
				"Ya existe una orden para esta cotización",
			);

			expect(mockOrderRepository.create).not.toHaveBeenCalled();
		});
	});
});
