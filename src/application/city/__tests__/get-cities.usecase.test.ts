import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetCitiesUseCase } from "../get-cities.usecase.js";
import type { ICityRepository } from "@domain/city/city.repository.js";
import type { City } from "@domain/city/city.entity.js";

// Factory to create repository mock
const createMockCityRepository = (): ICityRepository => ({
	findAllActive: vi.fn(),
});

// Factory to create test cities
const createTestCity = (overrides: Partial<City> = {}): City => ({
	id: 1,
	name: "Bogotá",
	department: "Cundinamarca",
	code: "BOG",
	isActive: true,
	...overrides,
});

describe("GetCitiesUseCase", () => {
	let useCase: GetCitiesUseCase;
	let mockCityRepository: ICityRepository;

	beforeEach(() => {
		mockCityRepository = createMockCityRepository();
		useCase = new GetCitiesUseCase(mockCityRepository);
	});

	describe("execute", () => {
		it("should return active cities from repository", async () => {
			// Arrange
			const expectedCities: City[] = [
				createTestCity({ id: 1, name: "Bogotá", code: "BOG" }),
				createTestCity({
					id: 2,
					name: "Medellín",
					department: "Antioquia",
					code: "MDE",
				}),
				createTestCity({
					id: 3,
					name: "Cali",
					department: "Valle del Cauca",
					code: "CLO",
				}),
			];
			vi.mocked(mockCityRepository.findAllActive).mockResolvedValue(
				expectedCities,
			);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result).toEqual(expectedCities);
			expect(mockCityRepository.findAllActive).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no cities exist", async () => {
			// Arrange
			vi.mocked(mockCityRepository.findAllActive).mockResolvedValue([]);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should propagate repository errors", async () => {
			// Arrange
			const error = new Error("Database connection error");
			vi.mocked(mockCityRepository.findAllActive).mockRejectedValue(error);

			// Act & Assert
			await expect(useCase.execute()).rejects.toThrow(
				"Database connection error",
			);
		});
	});
});
