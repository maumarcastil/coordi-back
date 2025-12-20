import type { Quote } from "@domain/quote/quote.entity.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";

export class GetQuoteByIdUseCase {
	constructor(private readonly quoteRepository: IQuoteRepository) {}

	async execute(quoteId: number, userId: number): Promise<Quote> {
		const quote = await this.quoteRepository.findById(quoteId);

		if (!quote) {
			throw new Error("Cotización no encontrada");
		}

		// Validar que la cotización pertenezca al usuario
		if (quote.userId !== userId) {
			throw new Error("No tienes permiso para ver esta cotización");
		}

		return quote;
	}
}

