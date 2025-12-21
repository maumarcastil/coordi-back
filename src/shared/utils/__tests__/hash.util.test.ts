import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../hash.util.js";

describe("hash.util", () => {
	describe("hashPassword", () => {
		it("should generate a hash different from the original password", async () => {
			const password = "mySecurePassword123";

			const hash = await hashPassword(password);

			expect(hash).not.toBe(password);
			expect(hash).toBeDefined();
		});
	});

	describe("comparePassword", () => {
		it("should return true when password matches the hash", async () => {
			const password = "mySecurePassword123";
			const hash = await hashPassword(password);

			const result = await comparePassword(password, hash);

			expect(result).toBe(true);
		});

		it("should return false when password does not match the hash", async () => {
			const password = "mySecurePassword123";
			const wrongPassword = "wrongPassword456";
			const hash = await hashPassword(password);

			const result = await comparePassword(wrongPassword, hash);

			expect(result).toBe(false);
		});
	});
});
