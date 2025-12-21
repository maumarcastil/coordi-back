import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/__tests__/**/*.test.ts"],
		exclude: ["node_modules", "dist"],
		testTimeout: 30000,
		hookTimeout: 60000,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/__tests__/**",
				"src/types/**",
				"src/index.ts",
				// Pass-through use cases (sin lógica de negocio)
				"src/application/quote/get-user-quotes.usecase.ts",
				"src/application/order/get-user-orders.usecase.ts",
			],
		},
	},
});
