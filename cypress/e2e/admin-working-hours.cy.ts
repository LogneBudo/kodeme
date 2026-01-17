/// <reference types="cypress" />

describe('Admin Working Hours Settings', () => {
  const email = Cypress.env('EMAIL');
  const password = Cypress.env('PASSWORD');

  before(() => {
    if (!email || !password) {
      throw new Error('Set Cypress env: EMAIL and PASSWORD');
    }
  });

  beforeEach(() => {
    // Login before each test
    cy.session('admin-login', () => {
      cy.visit('/admin/login');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.get('[class*="profileButton"]', { timeout: 10000 }).should('exist');
    });

    // Navigate to admin settings and select Working Hours tab
    cy.visit('/admin/settings');
    cy.contains('Working Hours', { timeout: 10000 }).click();
  });

  it('displays default working hours (09:00 AM - 05:00 PM)', () => {
    // Reset to defaults first
    cy.get('[data-testid="start-hour-select"]').select('9');
    cy.get('[data-testid="start-minute-select"]').select('0');
    cy.get('[data-testid="end-hour-select"]').select('17');
    cy.get('[data-testid="end-minute-select"]').select('0');
    
    // Check that default times are displayed
    cy.get('[data-testid="start-time-display"]').should('exist');
    cy.get('[data-testid="end-time-display"]').should('exist');
    
    // Verify the time format is shown (either 12h or 24h depending on locale)
    cy.get('[data-testid="start-time-display"]').invoke('text').should('match', /(09:00|09:00 AM)/);
    cy.get('[data-testid="end-time-display"]').invoke('text').should('match', /(17:00|05:00 PM)/);
  });

  it('shows time format based on user locale (12h or 24h)', () => {
    cy.get('[data-testid="start-time-display"]').invoke('text').then((text) => {
      // Check if format includes AM/PM (12-hour) or not (24-hour)
      const is12Hour = text.includes('AM') || text.includes('PM');
      
      if (is12Hour) {
        cy.log('User locale uses 12-hour format');
        cy.get('[data-testid="start-time-display"]').should('contain', 'AM');
        cy.get('[data-testid="end-time-display"]').should('contain', 'PM');
      } else {
        cy.log('User locale uses 24-hour format');
        cy.get('[data-testid="start-time-display"]').should('not.contain', 'AM');
        cy.get('[data-testid="start-time-display"]').should('not.contain', 'PM');
      }
    });
  });

  it('allows selecting start hour', () => {
    cy.get('[data-testid="start-hour-select"]').select('10');
    cy.get('[data-testid="start-time-display"]').invoke('text').should('match', /(10:00|10:00 AM)/);
  });

  it('allows selecting start minutes (15, 30, 45)', () => {
    cy.get('[data-testid="start-minute-select"]').select('15');
    cy.get('[data-testid="start-time-display"]').should('contain', '15');
    
    cy.get('[data-testid="start-minute-select"]').select('30');
    cy.get('[data-testid="start-time-display"]').should('contain', '30');
    
    cy.get('[data-testid="start-minute-select"]').select('45');
    cy.get('[data-testid="start-time-display"]').should('contain', '45');
  });

  it('allows selecting end hour', () => {
    // Reset minutes to 0 first to get clean time
    cy.get('[data-testid="end-minute-select"]').select('0');
    cy.get('[data-testid="end-hour-select"]').select('18');
    cy.get('[data-testid="end-time-display"]').invoke('text').should('match', /(18:00|06:00 PM)/);
  });

  it('allows selecting end minutes', () => {
    cy.get('[data-testid="end-minute-select"]').select('30');
    cy.get('[data-testid="end-time-display"]').should('contain', '30');
  });

  it('updates both start and end times independently', () => {
    // Set start time to 08:30
    cy.get('[data-testid="start-hour-select"]').select('8');
    cy.get('[data-testid="start-minute-select"]').select('30');
    cy.get('[data-testid="start-time-display"]').should('contain', '30');
    
    // Set end time to 18:45
    cy.get('[data-testid="end-hour-select"]').select('18');
    cy.get('[data-testid="end-minute-select"]').select('45');
    cy.get('[data-testid="end-time-display"]').should('contain', '45');
    
    // Verify both are correct
    cy.get('[data-testid="start-time-display"]').invoke('text').should('match', /(08:30|08:30 AM)/);
    cy.get('[data-testid="end-time-display"]').invoke('text').should('match', /(18:45|06:45 PM)/);
  });

  it('persists working hours after save', () => {
    // Change times
    cy.get('[data-testid="start-hour-select"]').select('7');
    cy.get('[data-testid="start-minute-select"]').select('30');
    cy.get('[data-testid="end-hour-select"]').select('19');
    cy.get('[data-testid="end-minute-select"]').select('15');
    
    // Save settings
    cy.contains('button', 'Save Settings').click();
    cy.contains('Settings saved successfully', { timeout: 10000 }).should('be.visible');
    
    // Reload page
    cy.reload();
    cy.contains('Working Hours', { timeout: 10000 }).click();
    
    // Verify times persisted
    cy.get('[data-testid="start-time-display"]').invoke('text').should('match', /(07:30|07:30 AM)/);
    cy.get('[data-testid="end-time-display"]').invoke('text').should('match', /(19:15|07:15 PM)/);
  });

  it('handles edge case times (midnight, noon)', () => {
    // Test midnight (00:00)
    cy.get('[data-testid="start-hour-select"]').select('0');
    cy.get('[data-testid="start-minute-select"]').select('0');
    cy.get('[data-testid="start-time-display"]').invoke('text').then((text) => {
      // In 12h: 12:00 AM, in 24h: 00:00
      expect(text).to.match(/(00:00|12:00 AM)/);
    });
    
    // Test noon (12:00)
    cy.get('[data-testid="end-hour-select"]').select('12');
    cy.get('[data-testid="end-minute-select"]').select('0');
    cy.get('[data-testid="end-time-display"]').invoke('text').then((text) => {
      // In 12h: 12:00 PM, in 24h: 12:00
      expect(text).to.match(/(12:00|12:00 PM)/);
    });
  });

  it('shows responsive layout on mobile', () => {
    cy.viewport('iphone-x');
    
    // Wait a moment for viewport to settle
    cy.wait(500);
    
    // Verify elements exist
    cy.get('[data-testid="start-time-display"]').should('exist');
    cy.get('[data-testid="end-time-display"]').should('exist');
    
    // Scroll to the element and interact
    cy.get('[data-testid="start-hour-select"]').scrollIntoView().select('11', { force: true });
    cy.get('[data-testid="start-minute-select"]').select('0', { force: true });
    cy.get('[data-testid="start-time-display"]').invoke('text').should('match', /(11:00|11:00 AM)/);
  });

  it('has proper accessibility labels', () => {
    cy.get('[aria-label="Start hour"]').should('exist');
    cy.get('[aria-label="Start minute"]').should('exist');
    cy.get('[aria-label="End hour"]').should('exist');
    cy.get('[aria-label="End minute"]').should('exist');
  });

  it('allows setting working hours to full day (00:00 - 23:45)', () => {
    cy.get('[data-testid="start-hour-select"]').select('0');
    cy.get('[data-testid="start-minute-select"]').select('0');
    cy.get('[data-testid="end-hour-select"]').select('23');
    cy.get('[data-testid="end-minute-select"]').select('45');
    
    cy.get('[data-testid="start-time-display"]').invoke('text').should('match', /(00:00|12:00 AM)/);
    cy.get('[data-testid="end-time-display"]').invoke('text').should('match', /(23:45|11:45 PM)/);
    
    // Save and verify
    cy.contains('button', 'Save Settings').click();
    cy.contains('Settings saved successfully', { timeout: 10000 }).should('be.visible');
  });
});
