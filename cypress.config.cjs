const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
  },
  video: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/junit.xml',
  },
  env: {
    EMAIL: process.env.CYPRESS_EMAIL || process.env.EMAIL,
    PASSWORD: process.env.CYPRESS_PASSWORD || process.env.PASSWORD,
  },
});
