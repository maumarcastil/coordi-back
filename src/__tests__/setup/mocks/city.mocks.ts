import { vi } from "vitest";
import type { ICityRepository } from "@domain/city/city.repository.js";
import type { City } from "@domain/city/city.entity.js";

// Repository mocks
export const createMockCityRepository = (): ICityRepository => ({
	findAllActive: vi.fn(),
});

// Entity factories
export const createTestCity = (overrides: Partial<City> = {}): City => ({
	id: 1,
	name: "Bogotá",
	department: "Cundinamarca",
	code: "BOG",
	isActive: true,
	...overrides,
});

