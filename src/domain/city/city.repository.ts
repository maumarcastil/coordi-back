import type { City } from "./city.entity.js";

export interface ICityRepository {
	findAllActive(): Promise<City[]>;
}

