export interface ShippingRate {
	id: number;
	cityAId: number;
	cityBId: number;
	basePrice: number;
	pricePerKg: number;
	distanceKm: number | null;
	isActive: boolean;
}

