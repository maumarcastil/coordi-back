import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateQuoteUseCase } from "../create-quote.usecase.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";
import type { IRateRepository } from "@domain/rate/rate.repository.js";
import type { Quote, CreateQuoteData } from "@domain/quote/quote.entity.js";
import type { ShippingRate } from "@domain/rate/rate.entity.js";

// Factory for mock repositories
const createMockQuoteRepository = (): IQuoteRepository => ({
	create: vi.fn(),
	findByUserId: vi.fn(),
	findById: vi.fn(),
	updateStatus: vi.fn(),
});

const createMockRateRepository = (): IRateRepository => ({
	findByPair: vi.fn(),
});

// Factory for test rate
const createTestRate = (overrides: Partial<ShippingRate> = {}): ShippingRate => ({
	id: 1,
	cityAId: 1,
	cityBId: 2,
	basePrice: 10000,
	pricePerKg: 500,
	distanceKm: 450,
	isActive: true,
	...overrides,
});

// Factory for test quote
const createTestQuote = (overrides: Partial<Quote> = {}): Quote => ({
	id: 1,
	userId: 1,
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

describe("CreateQuoteUseCase", () => {
	let useCase: CreateQuoteUseCase;
	let mockQuoteRepository: IQuoteRepository;
	let mockRateRepository: IRateRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		mockQuoteRepository = createMockQuoteRepository();
		mockRateRepository = createMockRateRepository();
		useCase = new CreateQuoteUseCase(mockQuoteRepository, mockRateRepository);

		// Default: rate exists and is active
		vi.mocked(mockRateRepository.findByPair).mockResolvedValue(createTestRate());
		vi.mocked(mockQuoteRepository.create).mockImplementation(
			async (data: CreateQuoteData) =>
				createTestQuote({
					...data,
					id: 1,
					status: "pending",
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
		);
	});

	describe("Pricing: Volumetric weight calculation", () => {
		it("should calculate volumetric weight as ceil((L×W×H)/2500)", async () => {
			// Case 1: 50×40×30 = 60000 / 2500 = 24 (exact)
			await useCase.execute(1, {
				originCityId: 1,
				destinationCityId: 2,
				weight: 5,
				length: 50,
				width: 40,
				height: 30,
			});

			expect(mockQuoteRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ volumetricWeight: 24 }),
			);

			// Case 2: 10×10×10 = 1000 / 2500 = 0.4 → ceil = 1
			vi.clearAllMocks();
			vi.mocked(mockRateRepository.findByPair).mockResolvedValue(createTestRate());
			vi.mocked(mockQuoteRepository.create).mockImplementation(
				async (data: CreateQuoteData) => createTestQuote({ ...data, id: 2 }),
			);

			await useCase.execute(1, {
				originCityId: 1,
				destinationCityId: 2,
				weight: 5,
				length: 10,
				width: 10,
				height: 10,
			});

			expect(mockQuoteRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ volumetricWeight: 1 }),
			);
		});
	});

	describe("Pricing: Chargeable weight selection", () => {
		it("should use MAX between real weight and volumetric weight", async () => {
			// Case 1: Volumetric > Real → use volumetric
			// 50×40×30 = 24 volumetric, 5 real → chargeable = 24
			await useCase.execute(1, {
				originCityId: 1,
				destinationCityId: 2,
				weight: 5,
				length: 50,
				width: 40,
				height: 30,
			});

			expect(mockQuoteRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ chargeableWeight: 24 }),
			);

			// Case 2: Real > Volumetric → use real
			// 10×10×10 = 1 volumetric, 50 real → chargeable = 50
			vi.clearAllMocks();
			vi.mocked(mockRateRepository.findByPair).mockResolvedValue(createTestRate());
			vi.mocked(mockQuoteRepository.create).mockImplementation(
				async (data: CreateQuoteData) => createTestQuote({ ...data, id: 2 }),
			);

			await useCase.execute(1, {
				originCityId: 1,
				destinationCityId: 2,
				weight: 50,
				length: 10,
				width: 10,
				height: 10,
			});

			expect(mockQuoteRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ chargeableWeight: 50 }),
			);
		});
	});

	describe("Pricing: Total price calculation", () => {
		it("should calculate totalPrice = basePrice + (chargeableWeight × pricePerKg)", async () => {
			// Rate: basePrice=10000, pricePerKg=500
			// Dimensions: 10×10×10 = 1 volumetric, weight=10 real → chargeable=10
			// Expected: 10000 + (10 × 500) = 15000
			await useCase.execute(1, {
				originCityId: 1,
				destinationCityId: 2,
				weight: 10,
				length: 10,
				width: 10,
				height: 10,
			});

			expect(mockQuoteRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ totalPrice: 15000 }),
			);
		});
	});

	describe("Integrity: Origin and destination validation", () => {
		it("should reject when origin city equals destination city", async () => {
			await expect(
				useCase.execute(1, {
					originCityId: 5,
					destinationCityId: 5, // Same as origin
					weight: 10,
					length: 20,
					width: 20,
					height: 20,
				}),
			).rejects.toThrow("La ciudad de origen y destino deben ser diferentes");

			// Verify repository was never called
			expect(mockRateRepository.findByPair).not.toHaveBeenCalled();
			expect(mockQuoteRepository.create).not.toHaveBeenCalled();
		});
	});
});

