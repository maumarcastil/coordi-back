import type { Quote } from "@domain/quote/quote.entity.js";
import type { IQuoteRepository } from "@domain/quote/quote.repository.js";

export class GetUserQuotesUseCase {
	constructor(private readonly quoteRepository: IQuoteRepository) {}

	async execute(userId: number): Promise<Quote[]> {
		return this.quoteRepository.findByUserId(userId);
	}
}

