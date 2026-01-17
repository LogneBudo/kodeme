/// <reference types="cypress" />

describe('Auth Flow', () => {
  const email = Cypress.env('EMAIL');
  const password = Cypress.env('PASSWORD');

  before(() => {
    if (!email || !password) {
      throw new Error('Set Cypress env: EMAIL and PASSWORD');
    }
  });

  it('logs in once with redirect and lands on admin settings', () => {
    cy.visit('/admin/login?redirect=/admin/settings');
    
    // Fill and submit login form
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password);
    cy.get('button[type="submit"]').click();
    
    // Wait for auth to complete and redirect
    cy.url({ timeout: 15000 }).should('include', '/admin/settings');
    // Check for profile button (user is logged in)
    cy.get('[class*="profileButton"]', { timeout: 10000 }).should('exist');
  });

  it('stays logged in when navigating to another admin page', () => {
    cy.visit('/admin/appointments');
    // Check for profile button (user is logged in)
    cy.get('[class*="profileButton"]', { timeout: 10000 }).should('exist');
    cy.url().should('include', '/admin/appointments');
  });

  it('logout clears auth and user cannot access admin pages', () => {
    cy.visit('/admin/settings');
    // Find and click the profile button to open dropdown
    cy.get('[class*="profileButton"]').click();
    // Click logout button in dropdown
    cy.contains('Logout').click();
    
    // After logout, user is redirected away (either to /BookAppointment or /admin/login)
    // and can no longer access admin pages
    cy.url({ timeout: 15000 }).should('not.include', '/admin/settings');
    
    // Try to visit admin page - should be redirected to login
    cy.visit('/admin/appointments');
    cy.url({ timeout: 10000 }).should('include', '/admin/login');
    
    // Verify we're logged out (login form is visible)
    cy.get('input[type="email"]').should('be.visible');
  });
});
