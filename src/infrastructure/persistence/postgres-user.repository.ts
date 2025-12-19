import type { Pool } from "pg";

import type { IUserRepository } from "@domain/user/user.repository.js";
import type { CreateUserData, User } from "@domain/user/user.entity.js";

export class PostgresUserRepository implements IUserRepository {
	constructor(private readonly pool: Pool) {}

	async create(data: CreateUserData): Promise<User> {
		const result = await this.pool.query(
			`INSERT INTO users (email, password, name) 
			 VALUES ($1, $2, $3) 
			 RETURNING id, email, password, name, created_at, updated_at`,
			[data.email, data.password, data.name],
		);

		return this.mapToUser(result.rows[0]);
	}

	async findByEmail(email: string): Promise<User | null> {
		const result = await this.pool.query(
			`SELECT id, email, password, name, created_at, updated_at 
			 FROM users WHERE email = $1`,
			[email],
		);
		return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
	}

	async findById(id: number): Promise<User | null> {
		const result = await this.pool.query(
			`SELECT id, email, password, name, created_at, updated_at 
			 FROM users WHERE id = $1`,
			[id],
		);
		return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
	}

	private mapToUser(row: {
		id: number;
		email: string;
		password: string;
		name: string;
		created_at: Date;
		updated_at: Date;
	}): User {
		return {
			id: row.id,
			email: row.email,
			password: row.password,
			name: row.name,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}
}
