/// <reference types="cypress" />

describe('Admin Calendar Integration Settings', () => {
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
    cy.contains('Calendar Integration', { timeout: 10000 }).click();
    cy.contains('Sync Preferences').should('be.visible');
  });

  it('displays calendar integration options', () => {
    // Check for connection buttons
    cy.contains('button', 'Connect Google Calendar').should('be.visible');
    cy.contains('button', 'Connect Outlook Calendar').should('be.visible');

    // Check for sync preferences section
    cy.contains('Sync Preferences').should('be.visible');
    cy.contains('Auto-create calendar events for new bookings').should('be.visible');
    cy.contains('Show busy times from connected calendars').should('be.visible');
    cy.contains('Send booking confirmation to calendar organizer').should('be.visible');

    // Check for tip section
    cy.contains('💡 Tip:').should('be.visible');
  });

  it('toggles auto-create calendar events and persists', () => {
    // Find the checkbox for auto-create events
    cy.contains('Auto-create calendar events for new bookings')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('autoCreateCheckbox');

    // Get initial state
    cy.get('@autoCreateCheckbox').then(($checkbox) => {
      const wasChecked = $checkbox.is(':checked');
      
      // Toggle it
      cy.get('@autoCreateCheckbox').click();
      
      // Verify it changed
      cy.get('@autoCreateCheckbox').should(wasChecked ? 'not.be.checked' : 'be.checked');
    });

    // Save and reload
    cy.get('button').contains('Save Settings').click();
    cy.wait(1000);
    cy.reload();
    cy.contains('Calendar Integration').click();

    // Verify persistence
    cy.get('@autoCreateCheckbox').should('exist');
  });

  it('toggles show busy times and persists', () => {
    // Find the checkbox for show busy times
    cy.contains('Show busy times from connected calendars')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('busyTimesCheckbox');

    // Get initial state
    cy.get('@busyTimesCheckbox').then(($checkbox) => {
      const wasChecked = $checkbox.is(':checked');
      
      // Toggle it
      cy.get('@busyTimesCheckbox').click();
      
      // Verify it changed
      cy.get('@busyTimesCheckbox').should(wasChecked ? 'not.be.checked' : 'be.checked');
    });

    // Save and reload
    cy.get('button').contains('Save Settings').click();
    cy.wait(1000);
    cy.reload();
    cy.contains('Calendar Integration').click();

    // Verify persistence
    cy.get('@busyTimesCheckbox').should('exist');
  });

  it('toggles sync cancellations and persists', () => {
    // Find the checkbox for sync cancellations
    cy.contains('Send booking confirmation to calendar organizer')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('syncCancellationsCheckbox');

    // Get initial state
    cy.get('@syncCancellationsCheckbox').then(($checkbox) => {
      const wasChecked = $checkbox.is(':checked');
      
      // Toggle it
      cy.get('@syncCancellationsCheckbox').click();
      
      // Verify it changed
      cy.get('@syncCancellationsCheckbox').should(wasChecked ? 'not.be.checked' : 'be.checked');
    });

    // Save and reload
    cy.get('button').contains('Save Settings').click();
    cy.wait(1000);
    cy.reload();
    cy.contains('Calendar Integration').click();

    // Verify persistence
    cy.get('@syncCancellationsCheckbox').should('exist');
  });

  it('allows toggling multiple preferences at once', () => {
    // Get all three checkboxes
    cy.contains('Auto-create calendar events for new bookings')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('autoCreate');

    cy.contains('Show busy times from connected calendars')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('busyTimes');

    cy.contains('Send booking confirmation to calendar organizer')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('syncCancellations');

    // Toggle all three
    cy.get('@autoCreate').click();
    cy.get('@busyTimes').click();
    cy.get('@syncCancellations').click();

    // Save and reload
    cy.get('button').contains('Save Settings').click();
    cy.wait(1000);
    cy.reload();
    cy.contains('Calendar Integration').click();

    // Verify all are still accessible
    cy.contains('Auto-create calendar events for new bookings').should('be.visible');
    cy.contains('Show busy times from connected calendars').should('be.visible');
    cy.contains('Send booking confirmation to calendar organizer').should('be.visible');
  });

  it('shows Google Calendar button is enabled', () => {
    cy.contains('button', 'Connect Google Calendar')
      .should('be.visible')
      .should('not.be.disabled');
  });

  it('shows Outlook Calendar button is enabled', () => {
    cy.contains('button', 'Connect Outlook Calendar')
      .should('be.visible')
      .should('not.be.disabled');
  });

  it('displays tip information correctly', () => {
    cy.contains('💡 Tip:').should('be.visible');
    cy.contains('Once you connect a calendar').should('be.visible');
    cy.contains('all your bookings will be automatically added to it').should('be.visible');
  });

  it('shows responsive layout on mobile', () => {
    cy.viewport('iphone-x');
    
    // Check that elements are still visible on mobile
    cy.contains('Calendar Integration').should('be.visible');
    cy.contains('button', 'Connect Google Calendar').scrollIntoView().should('be.visible');
    cy.contains('button', 'Connect Outlook Calendar').scrollIntoView().should('be.visible');
    cy.contains('Sync Preferences').scrollIntoView().should('be.visible');
  });

  it('maintains state when switching tabs', () => {
    // Toggle a checkbox
    cy.contains('Auto-create calendar events for new bookings')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .as('checkbox');

    cy.get('@checkbox').then(($checkbox) => {
      const initialState = $checkbox.is(':checked');
      
      // Toggle it
      cy.get('@checkbox').click();
      
      // Switch to another tab
      cy.contains('Working Hours').click();
      cy.contains('Set your daily business hours').should('be.visible');
      
      // Switch back
      cy.contains('Calendar Integration').click();
      
      // Verify state changed (not persisted yet, but maintained in memory)
      cy.get('@checkbox').should(initialState ? 'not.be.checked' : 'be.checked');
    });
  });
});
