import { vi } from "vitest";
import type { IUserRepository } from "@domain/user/user.repository.js";
import type { User, CreateUserData } from "@domain/user/user.entity.js";

// Repository mocks
export const createMockUserRepository = (): IUserRepository => ({
	create: vi.fn(),
	findByEmail: vi.fn(),
	findById: vi.fn(),
});

// Entity factories
export const createTestUser = (overrides: Partial<User> = {}): User => ({
	id: 1,
	email: "test@example.com",
	password: "hashed_password_here",
	name: "Test User",
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

// Helper to create user from CreateUserData
export const createUserFromData = (
	data: CreateUserData,
	overrides: Partial<User> = {},
): User => ({
	id: 1,
	...data,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

