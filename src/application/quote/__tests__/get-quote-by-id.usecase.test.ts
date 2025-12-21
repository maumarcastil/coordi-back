import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetQuoteByIdUseCase } from "../get-quote-by-id.usecase.js";
import {
	createMockQuoteRepository,
	createTestQuote,
} from "@test/mocks/index.js";

describe("GetQuoteByIdUseCase", () => {
	let useCase: GetQuoteByIdUseCase;
	let mockQuoteRepository: ReturnType<typeof createMockQuoteRepository>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockQuoteRepository = createMockQuoteRepository();
		useCase = new GetQuoteByIdUseCase(mockQuoteRepository);
	});

	describe("Security: Authorization", () => {
		it("should prevent users from accessing quotes they do not own", async () => {
			const quote = createTestQuote({ userId: 100 });
			vi.mocked(mockQuoteRepository.findById).mockResolvedValue(quote);

			const differentUserId = 999;

			await expect(useCase.execute(1, differentUserId)).rejects.toThrow(
				"No tienes permiso para ver esta cotización",
			);
		});
	});
});
