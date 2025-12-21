import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoginUserUseCase } from "../login-user.usecase.js";
import { createMockUserRepository, createTestUser } from "@test/mocks/index.js";

// Mock external dependencies
vi.mock("@shared/utils/hash.util.js", () => ({
	comparePassword: vi.fn(),
}));

vi.mock("@shared/utils/jwt.util.js", () => ({
	generateToken: vi.fn().mockReturnValue("mocked-token"),
}));

import { comparePassword } from "@shared/utils/hash.util.js";

describe("LoginUserUseCase", () => {
	let useCase: LoginUserUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockUserRepository = createMockUserRepository();
		useCase = new LoginUserUseCase(mockUserRepository);
	});

	describe("Security: Error message consistency", () => {
		it("should return same error message for non-existent email and wrong password", async () => {
			// Test 1: Non-existent email
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

			const nonExistentEmailError = await useCase
				.execute({ email: "notfound@example.com", password: "any" })
				.catch((e) => e.message);

			// Test 2: Wrong password
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				createTestUser(),
			);
			vi.mocked(comparePassword).mockResolvedValue(false);

			const wrongPasswordError = await useCase
				.execute({ email: "test@example.com", password: "wrong" })
				.catch((e) => e.message);

			// Both should have IDENTICAL error messages
			expect(nonExistentEmailError).toBe(wrongPasswordError);
			expect(nonExistentEmailError).toBe("Credenciales inválidas");
		});
	});

	describe("Security: Password exposure prevention", () => {
		it("should not expose password field in response", async () => {
			const user = createTestUser();
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
			vi.mocked(comparePassword).mockResolvedValue(true);

			const result = await useCase.execute({
				email: "test@example.com",
				password: "correct_password",
			});

			expect(result.user).not.toHaveProperty("password");
			expect((result.user as Record<string, unknown>).password).toBeUndefined();
			expect(result.user.id).toBe(user.id);
			expect(result.user.email).toBe(user.email);
			expect(result.user.name).toBe(user.name);
		});
	});
});
