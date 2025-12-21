import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetCitiesUseCase } from "../get-cities.usecase.js";
import { createMockCityRepository, createTestCity } from "@test/mocks/index.js";

describe("GetCitiesUseCase", () => {
	let useCase: GetCitiesUseCase;
	let mockCityRepository: ReturnType<typeof createMockCityRepository>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockCityRepository = createMockCityRepository();
		useCase = new GetCitiesUseCase(mockCityRepository);
	});

	describe("execute", () => {
		it("should return active cities from repository", async () => {
			const expectedCities = [
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

			const result = await useCase.execute();

			expect(result).toEqual(expectedCities);
			expect(mockCityRepository.findAllActive).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no cities exist", async () => {
			vi.mocked(mockCityRepository.findAllActive).mockResolvedValue([]);

			const result = await useCase.execute();

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should propagate repository errors", async () => {
			const error = new Error("Database connection error");
			vi.mocked(mockCityRepository.findAllActive).mockRejectedValue(error);

			await expect(useCase.execute()).rejects.toThrow(
				"Database connection error",
			);
		});
	});
});
