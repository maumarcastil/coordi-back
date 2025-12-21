import { vi } from "vitest";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";
import type { IRateRepository } from "@domain/rate/rate.repository.js";
import type { Quote, CreateQuoteData } from "@domain/quote/quote.entity.js";
import type { ShippingRate } from "@domain/rate/rate.entity.js";

// Repository mocks
export const createMockQuoteRepository = (): IQuoteRepository => ({
	create: vi.fn(),
	findByUserId: vi.fn(),
	findById: vi.fn(),
	updateStatus: vi.fn(),
});

export const createMockRateRepository = (): IRateRepository => ({
	findByPair: vi.fn(),
});

// Entity factories
export const createTestQuote = (overrides: Partial<Quote> = {}): Quote => ({
	id: 1,
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
	status: "pending",
	expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

export const createTestRate = (
	overrides: Partial<ShippingRate> = {},
): ShippingRate => ({
	id: 1,
	cityAId: 1,
	cityBId: 2,
	basePrice: 10000,
	pricePerKg: 500,
	distanceKm: 450,
	isActive: true,
	...overrides,
});

// Helper to create quote from CreateQuoteData
export const createQuoteFromData = (
	data: CreateQuoteData,
	overrides: Partial<Quote> = {},
): Quote => ({
	id: 1,
	...data,
	status: "pending",
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});
