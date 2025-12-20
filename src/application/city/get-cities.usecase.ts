import type { City } from "@domain/city/city.entity.js";
import type { ICityRepository } from "@domain/city/city.repository.js";

export class GetCitiesUseCase {
	constructor(private readonly cityRepository: ICityRepository) {}

	async execute(): Promise<City[]> {
		return this.cityRepository.findAllActive();
	}
}

