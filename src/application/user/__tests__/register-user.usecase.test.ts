import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegisterUserUseCase } from "../register-user.usecase.js";
import type { CreateUserData } from "@domain/user/user.entity.js";
import { createMockUserRepository, createTestUser } from "@test/mocks/index.js";

// Mock external dependencies
vi.mock("@shared/utils/hash.util.js", () => ({
	hashPassword: vi.fn(),
}));

vi.mock("@shared/utils/jwt.util.js", () => ({
	generateToken: vi.fn().mockReturnValue("mocked-token"),
}));

import { hashPassword } from "@shared/utils/hash.util.js";

describe("RegisterUserUseCase", () => {
	let useCase: RegisterUserUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockUserRepository = createMockUserRepository();
		useCase = new RegisterUserUseCase(mockUserRepository);
	});

	describe("Integrity: Duplicate email prevention", () => {
		it("should reject registration when email already exists", async () => {
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				createTestUser(),
			);

			await expect(
				useCase.execute({
					email: "existing@example.com",
					password: "password123",
					name: "New User",
				}),
			).rejects.toThrow("El email ya está registrado");
		});
	});

	describe("Security: Password hashing", () => {
		it("should hash password before saving (not store plain text)", async () => {
			const plainPassword = "myPlainPassword123";
			const hashedPassword = "$2b$10$hashedVersionOfPassword";

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(hashPassword).mockResolvedValue(hashedPassword);
			vi.mocked(mockUserRepository.create).mockImplementation(
				async (data: CreateUserData) => createTestUser({ ...data, id: 1 }),
			);

			await useCase.execute({
				email: "new@example.com",
				password: plainPassword,
				name: "New User",
			});

			expect(hashPassword).toHaveBeenCalledWith(plainPassword);
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					password: hashedPassword,
				}),
			);
			expect(mockUserRepository.create).not.toHaveBeenCalledWith(
				expect.objectContaining({
					password: plainPassword,
				}),
			);
		});
	});

	describe("Security: Password exposure prevention", () => {
		it("should not expose password field in response", async () => {
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(hashPassword).mockResolvedValue("hashed");
			vi.mocked(mockUserRepository.create).mockResolvedValue(
				createTestUser({
					email: "new@example.com",
					name: "New User",
				}),
			);

			const result = await useCase.execute({
				email: "new@example.com",
				password: "password123",
				name: "New User",
			});

			expect(result.user).not.toHaveProperty("password");
			expect((result.user as Record<string, unknown>).password).toBeUndefined();
			expect(result.user.email).toBe("new@example.com");
			expect(result.user.name).toBe("New User");
		});
	});
});
