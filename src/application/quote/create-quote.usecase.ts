import type {
	CreateQuoteInput,
	Quote,
} from "@domain/quote/quote.entity.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";
import type { IRateRepository } from "@domain/rate/rate.repository.js";

export class CreateQuoteUseCase {
	constructor(
		private readonly quoteRepository: IQuoteRepository,
		private readonly rateRepository: IRateRepository,
	) {}

	async execute(userId: number, input: CreateQuoteInput): Promise<Quote> {
		const { originCityId, destinationCityId, weight, length, width, height } =
			input;

		// Validar que origen y destino sean diferentes
		if (originCityId === destinationCityId) {
			throw new Error("La ciudad de origen y destino deben ser diferentes");
		}

		// Ordenar IDs para buscar tarifa simétrica
		const cityAId = Math.min(originCityId, destinationCityId);
		const cityBId = Math.max(originCityId, destinationCityId);

		// Buscar tarifa
		const rate = await this.rateRepository.findByPair(cityAId, cityBId);

		if (!rate) {
			throw new Error("No existe tarifa para esta ruta");
		}

		if (!rate.isActive) {
			throw new Error("La tarifa para esta ruta no está activa");
		}

		// Calcular peso volumétrico (redondear hacia arriba)
		const volumetricWeight = this.calculateVolumetricWeight(length, width, height);

		// Peso cobrable es el mayor entre peso real y volumétrico
		const chargeableWeight = Math.max(weight, volumetricWeight);

		// Calcular precio total
		const totalPrice = rate.basePrice + chargeableWeight * rate.pricePerKg;

		// Fecha de expiración (7 días desde ahora)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		// Crear cotización
		const quote = await this.quoteRepository.create({
			userId,
			originCityId,
			destinationCityId,
			weight,
			length,
			width,
			height,
			volumetricWeight,
			chargeableWeight,
			totalPrice,
			expiresAt,
		});

		return quote;
	}


	private calculateVolumetricWeight(length: number, width: number, height: number): number {
		return Math.ceil((length * width * height) / 2500);
	}
}

