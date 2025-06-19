import { defineConfig } from 'vitest/config';

export default defineConfig({
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
    
    // UI mode disabled by default (use npm run test:ui to enable)
    ui: false,
    
    // Watch mode disabled for regular runs (use npm run test:watch to enable)
    watch: false,
    
    // Reporter configuration
    reporters: ['verbose', 'html'],
    
    // Globals (allows using describe, it, expect without imports)
    globals: true
  }
}); 