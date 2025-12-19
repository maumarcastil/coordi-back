import type { CreateUserData, User } from "./user.entity.js";

export interface IUserRepository {
	create(data: CreateUserData): Promise<User>;
	findByEmail(email: string): Promise<User | null>;
	findById(id: number): Promise<User | null>;
}
