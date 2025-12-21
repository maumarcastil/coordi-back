import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetQuoteByIdUseCase } from "../get-quote-by-id.usecase.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";
import type { Quote } from "@domain/quote/quote.entity.js";

// Factory for mock repository
const createMockQuoteRepository = (): IQuoteRepository => ({
	create: vi.fn(),
	findByUserId: vi.fn(),
	findById: vi.fn(),
	updateStatus: vi.fn(),
});

// Factory for test quote
const createTestQuote = (overrides: Partial<Quote> = {}): Quote => ({
	id: 1,
	userId: 100, // Owner is user 100
	originCityId: 1,
	destinationCityId: 2,
	weight: 10,
	length: 30,
	width: 20,
	height: 15,
	volumetricWeight: 4,
	chargeableWeight: 10,
	totalPrice: 15000,
	status: "pending",
	expiresAt: new Date(),
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

describe("GetQuoteByIdUseCase", () => {
	let useCase: GetQuoteByIdUseCase;
	let mockQuoteRepository: IQuoteRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		mockQuoteRepository = createMockQuoteRepository();
		useCase = new GetQuoteByIdUseCase(mockQuoteRepository);
	});

	describe("Security: Authorization", () => {
		it("should prevent users from accessing quotes they do not own", async () => {
			const quote = createTestQuote({ userId: 100 }); // Quote belongs to user 100
			vi.mocked(mockQuoteRepository.findById).mockResolvedValue(quote);

			const differentUserId = 999; // Different user trying to access

			await expect(useCase.execute(1, differentUserId)).rejects.toThrow(
				"No tienes permiso para ver esta cotización",
			);
		});
	});
});

