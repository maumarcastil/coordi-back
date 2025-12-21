import type { UserWithoutPassword } from "@domain/user/user.entity.js";
import type { IUserRepository } from "@domain/user/user.repository.js";
import { hashPassword } from "@shared/utils/hash.util.js";
import { generateToken } from "@shared/utils/jwt.util.js";

export interface RegisterUserInput {
	email: string;
	password: string;
	name: string;
}

export interface RegisterUserOutput {
	token: string;
	user: UserWithoutPassword;
}

export class RegisterUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
		const existingUser = await this.userRepository.findByEmail(input.email);

		if (existingUser) {
			throw new Error("El email ya está registrado");
		}

		const hashedPassword = await hashPassword(input.password);

		const user = await this.userRepository.create({
			email: input.email,
			password: hashedPassword,
			name: input.name,
		});

		const token = generateToken({
			userId: user.id,
			email: user.email,
		});

		return {
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		};
	}
}
