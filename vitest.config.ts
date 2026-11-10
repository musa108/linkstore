import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    esbuild: { jsx: "automatic" },
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    test: {
        include: ["tests/**/*.test.{ts,tsx}"],
        environment: "node",
        testTimeout: 30_000,
        hookTimeout: 60_000,
        fileParallelism: false, // integration tests share one disposable database
        globalSetup: ["tests/global-setup.ts"],
        setupFiles: ["tests/setup-env.ts"],
    },
});
