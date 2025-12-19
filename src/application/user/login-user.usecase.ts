import type { UserWithoutPassword } from "@domain/user/user.entity.js";
import type { IUserRepository } from "@domain/user/user.repository.js";
import { comparePassword } from "@shared/utils/hash.util.js";
import { generateToken } from "@shared/utils/jwt.util.js";

export interface LoginUserInput {
	email: string;
	password: string;
}

export interface LoginUserOutput {
	token: string;
	user: UserWithoutPassword;
}

export class LoginUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: LoginUserInput): Promise<LoginUserOutput> {
		const user = await this.userRepository.findByEmail(input.email);

		if (!user) {
			throw new Error("Credenciales inválidas");
		}

		const isPasswordValid = await comparePassword(
			input.password,
			user.password,
		);

		if (!isPasswordValid) {
			throw new Error("Credenciales inválidas");
		}

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
