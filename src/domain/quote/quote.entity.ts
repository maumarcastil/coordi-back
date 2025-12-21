export interface Quote {
	id: number;
	userId: number;
	originCityId: number;
	destinationCityId: number;
	weight: number;
	length: number;
	width: number;
	height: number;
	volumetricWeight: number;
	chargeableWeight: number;
	totalPrice: number;
	status: "pending" | "converted" | "expired";
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateQuoteInput {
	originCityId: number;
	destinationCityId: number;
	weight: number;
	length: number;
	width: number;
	height: number;
}

export interface CreateQuoteData extends CreateQuoteInput {
	userId: number;
	volumetricWeight: number;
	chargeableWeight: number;
	totalPrice: number;
	expiresAt: Date;
}

