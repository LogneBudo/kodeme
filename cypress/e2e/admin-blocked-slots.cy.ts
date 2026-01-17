/// <reference types="cypress" />

describe('Admin Blocked Slots Settings', () => {
  const email = Cypress.env('EMAIL');
  const password = Cypress.env('PASSWORD');

  before(() => {
    if (!email || !password) {
      throw new Error('Set Cypress env: EMAIL and PASSWORD');
    }
  });

  beforeEach(() => {
    cy.session('admin-login', () => {
      cy.visit('/admin/login');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.get('[class*="profileButton"]', { timeout: 10000 }).should('exist');
    });

    cy.visit('/admin/settings');
    cy.contains('Blocked Time Slots', { timeout: 10000 }).click();
    cy.get('[data-testid="blocked-slots-container"]').should('be.visible');
  });

  it('adds a daily blocked slot and persists after save', () => {
    // Set time using selects
    cy.get('[data-testid="blocked-start-hour"]').select('12');
    cy.get('[data-testid="blocked-start-minute"]').select('00');
    cy.get('[data-testid="blocked-end-hour"]').select('13');
    cy.get('[data-testid="blocked-end-minute"]').select('00');
    cy.get('[data-testid="blocked-label"]').clear().type('Lunch');

    // Add
    cy.get('[data-testid="add-blocked-slot"]').click();

    // Expect it to appear in display with "Every day"
    cy.get('[data-testid="blocked-slots-display"]').should('contain', 'Lunch');
    cy.get('[data-testid="blocked-slots-display"]').should('contain', 'Every day');

    // Save and reload
    cy.get('button').contains('Save Settings').click();
    cy.wait(1000);
    cy.reload();
    cy.contains('Blocked Time Slots').click();

    // Verify persisted
    cy.contains('Lunch').should('be.visible');
    cy.contains('Every day').should('be.visible');
  });

  it('rejects invalid times (start >= end)', () => {
    cy.get('[data-testid="blocked-start-hour"]').select('10');
    cy.get('[data-testid="blocked-start-minute"]').select('00');
    cy.get('[data-testid="blocked-end-hour"]').select('09');
    cy.get('[data-testid="blocked-end-minute"]').select('00');
    cy.get('[data-testid="blocked-label"]').clear().type('Invalid');

    cy.get('[data-testid="add-blocked-slot"]').click();
    // Expect toast error
    cy.contains('Start time must be before end time').should('be.visible');
  });

  it('removes an existing daily blocked slot', () => {
    // Add then remove
    cy.get('[data-testid="blocked-start-hour"]').select('16');
    cy.get('[data-testid="blocked-start-minute"]').select('00');
    cy.get('[data-testid="blocked-end-hour"]').select('16');
    cy.get('[data-testid="blocked-end-minute"]').select('30');
    cy.get('[data-testid="blocked-label"]').clear().type('Break');
    cy.get('[data-testid="add-blocked-slot"]').click();

    // Find the list item containing label "Break" and matching time and scope, then remove
    cy.contains('li', 'Break', { timeout: 5000 }).within(() => {
      cy.contains('16:00 - 16:30');
      cy.contains('Every day');
      cy.get('[data-testid^="remove-blocked-"]').click({ force: true });
    });

    // Save and reload
    cy.get('button').contains('Save Settings').click();
    cy.wait(1000);
    cy.reload();
    cy.contains('Blocked Time Slots').click();

    // Check that the specific label and time range are not present
    cy.contains('Break').should('not.exist');
    cy.contains('16:00 - 16:30').should('not.exist');
  });

  it('allows only 15-minute increments (00, 15, 30)', () => {
    // Verify minute options are limited
    cy.get('[data-testid="blocked-start-minute"]').find('option').should('have.length', 3);
    cy.get('[data-testid="blocked-start-minute"]').find('option').eq(0).should('have.value', '00');
    cy.get('[data-testid="blocked-start-minute"]').find('option').eq(1).should('have.value', '15');
    cy.get('[data-testid="blocked-start-minute"]').find('option').eq(2).should('have.value', '30');

    // Test with 15-minute increment
    cy.get('[data-testid="blocked-start-hour"]').select('10');
    cy.get('[data-testid="blocked-start-minute"]').select('15');
    cy.get('[data-testid="blocked-end-hour"]').select('10');
    cy.get('[data-testid="blocked-end-minute"]').select('30');
    cy.get('[data-testid="blocked-label"]').clear().type('Quick Break');
    cy.get('[data-testid="add-blocked-slot"]').click();

    // Scroll to the list and verify it appears correctly
    cy.contains('10:15 - 10:30').scrollIntoView().should('be.visible');
  });

  it('shows responsive layout on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('[data-testid="blocked-slots-container"]').scrollIntoView().should('be.visible');
    cy.get('[data-testid="add-blocked-slot"]').scrollIntoView().should('be.visible');
  });
});
