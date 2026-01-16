/**
 * Shared validation utilities for forms and inputs
 * Provides consistent validation across the application
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 * Checks if the email format is valid
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Phone number validation
 * Supports various phone formats with optional country codes
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().]/g, "");

  // Check for valid phone number (10-15 digits, optional + prefix)
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "Please enter a valid phone number (10-15 digits)",
    };
  }

  return { isValid: true };
}

/**
 * Date validation
 * Checks if date is valid and optionally within a range
 */
export function validateDate(
  date: string | Date,
  options?: {
    minDate?: Date;
    maxDate?: Date;
    allowPast?: boolean;
  }
): ValidationResult {
  if (!date) {
    return { isValid: false, error: "Date is required" };
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: "Please enter a valid date" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if past dates are allowed
  if (options?.allowPast === false && dateObj < today) {
    return { isValid: false, error: "Date cannot be in the past" };
  }

  // Check minimum date
  if (options?.minDate && dateObj < options.minDate) {
    return {
      isValid: false,
      error: `Date must be after ${options.minDate.toLocaleDateString()}`,
    };
  }

  // Check maximum date
  if (options?.maxDate && dateObj > options.maxDate) {
    return {
      isValid: false,
      error: `Date must be before ${options.maxDate.toLocaleDateString()}`,
    };
  }

  return { isValid: true };
}

/**
 * Required text field validation
 * Checks if text is not empty
 */
export function validateRequired(
  value: string,
  fieldName: string = "This field"
): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Text length validation
 * Checks if text length is within specified range
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): ValidationResult {
  const length = value.trim().length;

  if (min !== undefined && length < min) {
    return {
      isValid: false,
      error: `Must be at least ${min} characters`,
    };
  }

  if (max !== undefined && length > max) {
    return {
      isValid: false,
      error: `Must be no more than ${max} characters`,
    };
  }

  return { isValid: true };
}

/**
 * URL validation
 * Checks if the URL format is valid
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { isValid: false, error: "URL is required" };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
}

/**
 * Postal/ZIP code validation
 * Supports various formats
 */
export function validatePostalCode(
  postalCode: string,
  country: "US" | "UK" | "CA" | "generic" = "generic"
): ValidationResult {
  if (!postalCode || !postalCode.trim()) {
    return { isValid: false, error: "Postal code is required" };
  }

  const patterns = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    generic: /^[A-Z0-9\s-]{3,10}$/i,
  };

  const regex = patterns[country];
  if (!regex.test(postalCode)) {
    return { isValid: false, error: "Please enter a valid postal code" };
  }

  return { isValid: true };
}

/**
 * Numeric validation
 * Checks if value is a valid number within optional range
 */
export function validateNumber(
  value: string | number,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): ValidationResult {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: "Please enter a valid number" };
  }

  if (options?.integer && !Number.isInteger(num)) {
    return { isValid: false, error: "Please enter a whole number" };
  }

  if (options?.min !== undefined && num < options.min) {
    return { isValid: false, error: `Must be at least ${options.min}` };
  }

  if (options?.max !== undefined && num > options.max) {
    return { isValid: false, error: `Must be no more than ${options.max}` };
  }

  return { isValid: true };
}

/**
 * Combine multiple validators
 * Runs all validators and returns first error found
 */
export function combineValidators(
  ...validators: (() => ValidationResult)[]
): ValidationResult {
  for (const validator of validators) {
    const result = validator();
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}
