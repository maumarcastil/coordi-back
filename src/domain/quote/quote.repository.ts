import type { CreateQuoteData, Quote } from "./quote.entity.js";

export interface IQuoteRepository {
	create(data: CreateQuoteData): Promise<Quote>;
	findByUserId(userId: number): Promise<Quote[]>;
	findById(id: number): Promise<Quote | null>;
}

