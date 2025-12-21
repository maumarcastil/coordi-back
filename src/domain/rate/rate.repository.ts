import type { ShippingRate } from "./rate.entity.js";

export interface IRateRepository {
	findByPair(cityAId: number, cityBId: number): Promise<ShippingRate | null>;
}

