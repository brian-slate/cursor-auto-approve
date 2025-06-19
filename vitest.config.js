"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        // Use happy-dom for DOM simulation (faster than jsdom)
        environment: 'happy-dom',
        // Test file patterns
        include: ['src/**/*.{test,spec}.{js,ts}'],
        // Setup files
        setupFiles: ['./src/test/setup.ts'],
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/test/**',
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'node_modules/**'
            ]
        },
        // Global test timeout
        testTimeout: 10000,
        // Enable UI mode
        ui: true,
        // Watch mode settings
        watch: true,
        // Reporter configuration
        reporters: ['verbose', 'html'],
        // Globals (allows using describe, it, expect without imports)
        globals: true
    }
});
//# sourceMappingURL=vitest.config.js.map