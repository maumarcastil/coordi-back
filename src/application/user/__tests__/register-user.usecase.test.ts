import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegisterUserUseCase } from "../register-user.usecase.js";
import type { IUserRepository } from "@domain/user/user.repository.js";
import type { User, CreateUserData } from "@domain/user/user.entity.js";

// Mock external dependencies
vi.mock("@shared/utils/hash.util.js", () => ({
	hashPassword: vi.fn(),
}));

vi.mock("@shared/utils/jwt.util.js", () => ({
	generateToken: vi.fn().mockReturnValue("mocked-token"),
}));

import { hashPassword } from "@shared/utils/hash.util.js";

// Factory for mock repository
const createMockUserRepository = (): IUserRepository => ({
	create: vi.fn(),
	findByEmail: vi.fn(),
	findById: vi.fn(),
});

// Factory for test user
const createTestUser = (overrides: Partial<User> = {}): User => ({
	id: 1,
	email: "test@example.com",
	password: "hashed_password",
	name: "Test User",
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

describe("RegisterUserUseCase", () => {
	let useCase: RegisterUserUseCase;
	let mockUserRepository: IUserRepository;

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

			// Verify hashPassword was called with plain password
			expect(hashPassword).toHaveBeenCalledWith(plainPassword);

			// Verify repository.create was called with HASHED password, not plain
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					password: hashedPassword,
				}),
			);

			// Verify plain password was NOT passed to repository
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

			// Verify password is NOT in the response
			expect(result.user).not.toHaveProperty("password");
			expect((result.user as Record<string, unknown>).password).toBeUndefined();

			// Verify other fields ARE present
			expect(result.user.email).toBe("new@example.com");
			expect(result.user.name).toBe("New User");
		});
	});
});

