import { describe, it, expect } from "vitest";
import { generateToken, verifyToken, type JwtPayload } from "../jwt.util.js";

describe("jwt.util", () => {
	const validPayload: JwtPayload = {
		userId: 123,
		email: "test@example.com",
	};

	describe("generateToken + verifyToken", () => {
		it("should generate a token that can be decoded with correct payload", () => {
			const token = generateToken(validPayload);

			const decoded = verifyToken(token);

			expect(decoded.userId).toBe(validPayload.userId);
			expect(decoded.email).toBe(validPayload.email);
		});
	});

	describe("verifyToken", () => {
		it("should throw an error for an invalid token", () => {
			const invalidToken = "invalid.token.here";

			expect(() => verifyToken(invalidToken)).toThrow();
		});

		it("should throw an error for a token signed with different secret", () => {
			// Valid JWT structure but signed with a different secret
			const tokenWithDifferentSecret =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAwMDAwMDAwfQ.invalid_signature";

			expect(() => verifyToken(tokenWithDifferentSecret)).toThrow();
		});
	});
});
