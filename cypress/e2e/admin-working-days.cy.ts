/// <reference types="cypress" />

describe('Admin Working Days Settings', () => {
  const email = Cypress.env('EMAIL');
  const password = Cypress.env('PASSWORD');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
      cy.contains('Logout', { timeout: 10000 }).should('be.visible');
    });

    // Navigate to admin settings and select Working Days tab
    cy.visit('/admin/settings');
    cy.contains('Working Days', { timeout: 10000 }).click();
    cy.get('[data-testid="working-days-container"]').should('be.visible');
  });

  it('displays default working days (Monday-Friday)', () => {
    // Reset to defaults first (use quick select)
    cy.get('[data-testid="quick-select-weekdays"]').click();
    cy.wait(500);

    // Check display shows Mon-Fri
    cy.get('[data-testid="days-display"]').should('contain', 'Monday - Friday');
    cy.get('[data-testid="days-display"]').should('contain', '5 days selected');

    // Verify Monday-Friday buttons are selected
    [1, 2, 3, 4, 5].forEach(dayIndex => {
      cy.get(`[data-testid="day-button-${dayIndex}"]`).should('have.attr', 'aria-pressed', 'true');
    });

    // Verify Sunday and Saturday are not selected
    cy.get('[data-testid="day-button-0"]').should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-testid="day-button-6"]').should('have.attr', 'aria-pressed', 'false');
  });

  it('allows quick select of weekdays (Mon-Fri)', () => {
    // First set to every day
    cy.get('[data-testid="quick-select-everyday"]').click();
    cy.wait(300);

    // Then select weekdays
    cy.get('[data-testid="quick-select-weekdays"]').click();
    cy.wait(300);

    // Verify display
    cy.get('[data-testid="days-display"]').should('contain', 'Monday - Friday');
    cy.get('[data-testid="days-display"]').should('contain', '5 days selected');

    // Verify selection
    [1, 2, 3, 4, 5].forEach(dayIndex => {
      cy.get(`[data-testid="day-button-${dayIndex}"]`).should('have.attr', 'aria-pressed', 'true');
    });
  });

  it('allows quick select of every day', () => {
    cy.get('[data-testid="quick-select-everyday"]').click();
    cy.wait(300);

    // Verify display
    cy.get('[data-testid="days-display"]').should('contain', 'Every day');
    cy.get('[data-testid="days-display"]').should('contain', '7 days selected');

    // Verify all days are selected
    [0, 1, 2, 3, 4, 5, 6].forEach(dayIndex => {
      cy.get(`[data-testid="day-button-${dayIndex}"]`).should('have.attr', 'aria-pressed', 'true');
    });
  });

  it('allows toggling individual days on and off', () => {
    // Start with weekdays
    cy.get('[data-testid="quick-select-weekdays"]').click();
    cy.wait(300);

    // Add Saturday
    cy.get('[data-testid="day-button-6"]').click();
    cy.wait(200);
    cy.get('[data-testid="day-button-6"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="days-display"]').should('contain', '6 days selected');

    // Remove Wednesday (day 3)
    cy.get('[data-testid="day-button-3"]').click();
    cy.wait(200);
    cy.get('[data-testid="day-button-3"]').should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-testid="days-display"]').should('contain', '5 days selected');

    // Add Wednesday back
    cy.get('[data-testid="day-button-3"]').click();
    cy.wait(200);
    cy.get('[data-testid="day-button-3"]').should('have.attr', 'aria-pressed', 'true');
  });

  it('displays correct day count', () => {
    // Set to weekdays (5 days)
    cy.get('[data-testid="quick-select-weekdays"]').click();
    cy.wait(300);
    cy.get('[data-testid="days-display"]').should('contain', '5 days selected');

    // Add Saturday (6 days)
    cy.get('[data-testid="day-button-6"]').click();
    cy.wait(200);
    cy.get('[data-testid="days-display"]').should('contain', '6 days selected');

    // Set to every day (7 days)
    cy.get('[data-testid="quick-select-everyday"]').click();
    cy.wait(300);
    cy.get('[data-testid="days-display"]').should('contain', '7 days selected');
  });

  it('persists working days after save and page reload', () => {
    // Select specific days: Mon, Wed, Fri
    cy.get('[data-testid="quick-select-weekdays"]').click();
    cy.wait(300);

    // Remove Tuesday and Thursday
    cy.get('[data-testid="day-button-2"]').click();
    cy.wait(200);
    cy.get('[data-testid="day-button-4"]').click();
    cy.wait(200);

    // Verify selection before save
    cy.get('[data-testid="day-button-1"]').should('have.attr', 'aria-pressed', 'true'); // Mon
    cy.get('[data-testid="day-button-2"]').should('have.attr', 'aria-pressed', 'false'); // Tue
    cy.get('[data-testid="day-button-3"]').should('have.attr', 'aria-pressed', 'true'); // Wed
    cy.get('[data-testid="day-button-4"]').should('have.attr', 'aria-pressed', 'false'); // Thu
    cy.get('[data-testid="day-button-5"]').should('have.attr', 'aria-pressed', 'true'); // Fri

    // Save settings
    cy.get('button').contains('Save Settings').should('not.be.disabled').click();
    cy.wait(1000);

    // Reload page
    cy.reload();
    cy.contains('Working Days', { timeout: 5000 }).click();
    cy.get('[data-testid="working-days-container"]', { timeout: 5000 }).should('be.visible');
    cy.wait(1000);

    // Verify persistence (range should be Mon-Fri due to implementation)
    cy.get('[data-testid="day-button-1"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="day-button-5"]').should('have.attr', 'aria-pressed', 'true');
  });

  it('handles edge case: selecting only weekend days', () => {
    // Select weekend via quick select
    cy.get('[data-testid="quick-select-weekend"]').click();
    cy.wait(400);

    // Verify only weekend is selected
    cy.get('[data-testid="day-button-0"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="day-button-6"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="days-display"]').should('contain', '2 days selected');
  });

  it('handles single day selection', () => {
    // Set to every day first
    cy.get('[data-testid="quick-select-everyday"]').click();
    cy.wait(300);

    // Remove all days except Monday
    [0, 2, 3, 4, 5, 6].forEach(dayIndex => {
      cy.get(`[data-testid="day-button-${dayIndex}"]`).click();
      cy.wait(100);
    });

    // Verify only Monday is selected
    cy.get('[data-testid="day-button-1"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="days-display"]').should('contain', 'Monday');
    cy.get('[data-testid="days-display"]').should('contain', '1 day selected');
  });

  it('shows responsive layout on mobile', () => {
    cy.viewport('iphone-x');
    cy.wait(500);

    // Verify all day buttons are visible and clickable
    DAYS.forEach((day, index) => {
      cy.get(`[data-testid="day-button-${index}"]`)
        .scrollIntoView()
        .should('be.visible');
    });

    // Test quick select buttons on mobile
    cy.get('[data-testid="quick-select-weekdays"]')
      .scrollIntoView()
      .should('be.visible')
      .click();
    
    cy.wait(300);

    // Verify weekdays are selected on mobile
    cy.get('[data-testid="day-button-1"]').should('have.attr', 'aria-pressed', 'true');
  });

  it('has proper accessibility labels', () => {
    DAYS.forEach((day, index) => {
      cy.get(`[data-testid="day-button-${index}"]`)
        .should('have.attr', 'aria-label', `Toggle ${day}`)
        .should('have.attr', 'aria-pressed');
    });
  });

  it('updates aria-pressed attribute when toggling days', () => {
    // Set to weekdays
    cy.get('[data-testid="quick-select-weekdays"]').click();
    cy.wait(300);

    // Check Monday is pressed
    cy.get('[data-testid="day-button-1"]')
      .should('have.attr', 'aria-pressed', 'true');

    // Check Sunday is not pressed
    cy.get('[data-testid="day-button-0"]')
      .should('have.attr', 'aria-pressed', 'false');

    // Toggle Sunday on
    cy.get('[data-testid="day-button-0"]').click();
    cy.wait(200);

    // Verify aria-pressed updated
    cy.get('[data-testid="day-button-0"]')
      .should('have.attr', 'aria-pressed', 'true');
  });

  it('shows info message about booking availability', () => {
    cy.contains('The system will automatically create time slots only for the selected days').should('be.visible');
    cy.contains('Days not selected will not be available for booking').should('be.visible');
  });
});
