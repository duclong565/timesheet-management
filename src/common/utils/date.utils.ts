import { BadRequestException } from '@nestjs/common';

/**
 * Global date utility functions for handling date conversions and validations
 * Used across all services to ensure consistent date handling with Prisma
 */

/**
 * Converts a date string to a Date object for Prisma queries
 * Handles various input formats and validates the result
 * @param dateInput - Date string in YYYY-MM-DD format or Date object
 * @param fieldName - Name of the field for error messages
 * @returns Valid Date object or null if input is null/undefined
 * @throws BadRequestException if date is invalid
 */
export function parseAndValidateDate(
  dateInput: string | Date | null | undefined,
  fieldName: string = 'date',
): Date | null {
  if (!dateInput) {
    return null;
  }

  let parsedDate: Date;

  if (dateInput instanceof Date) {
    parsedDate = dateInput;
  } else if (typeof dateInput === 'string') {
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Create date at start of day in UTC to avoid timezone issues
      parsedDate = new Date(`${dateInput}T00:00:00.000Z`);
    } else {
      // Try to parse as ISO string or other formats
      parsedDate = new Date(dateInput);
    }
  } else {
    throw new BadRequestException(
      `Invalid ${fieldName} format. Expected string or Date object.`,
    );
  }

  // Validate that the date is valid
  if (isNaN(parsedDate.getTime())) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Please provide a valid date in YYYY-MM-DD format.`,
    );
  }

  return parsedDate;
}

/**
 * Converts date input to start of day (00:00:00.000Z)
 * Used for "greater than or equal" comparisons
 * @param dateInput - Date string or Date object
 * @param fieldName - Name of the field for error messages
 * @returns Date object at start of day or null
 */
export function parseToStartOfDay(
  dateInput: string | Date | null | undefined,
  fieldName: string = 'startDate',
): Date | null {
  const date = parseAndValidateDate(dateInput, fieldName);
  if (!date) return null;

  // Ensure we get start of day in UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Converts date input to end of day (23:59:59.999Z)
 * Used for "less than or equal" comparisons
 * @param dateInput - Date string or Date object
 * @param fieldName - Name of the field for error messages
 * @returns Date object at end of day or null
 */
export function parseToEndOfDay(
  dateInput: string | Date | null | undefined,
  fieldName: string = 'endDate',
): Date | null {
  const date = parseAndValidateDate(dateInput, fieldName);
  if (!date) return null;

  // Ensure we get end of day in UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
}

/**
 * Builds date range conditions for Prisma queries
 * Handles both single date field and separate start/end date fields
 * @param startDate - Start date string or Date
 * @param endDate - End date string or Date
 * @param dateField - Name of the date field in the database (default: 'date')
 * @returns Object with date conditions for Prisma where clause
 */
export function buildDateRangeConditions(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  dateField: string = 'date',
) {
  const conditions: any[] = [];

  if (startDate) {
    const startOfDay = parseToStartOfDay(startDate, 'startDate');
    if (startOfDay) {
      conditions.push({
        [dateField]: {
          gte: startOfDay,
        },
      });
    }
  }

  if (endDate) {
    const endOfDay = parseToEndOfDay(endDate, 'endDate');
    if (endOfDay) {
      conditions.push({
        [dateField]: {
          lte: endOfDay,
        },
      });
    }
  }

  return conditions;
}

/**
 * Builds date range conditions for requests with separate start_date and end_date fields
 * Handles overlapping date ranges properly
 * @param startDate - Filter start date
 * @param endDate - Filter end date
 * @returns Object with date conditions for Prisma where clause
 */
export function buildRequestDateRangeConditions(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
) {
  const conditions: any[] = [];

  if (startDate) {
    const startOfDay = parseToStartOfDay(startDate, 'startDate');
    if (startOfDay) {
      // Request end_date must be >= filter start date (request hasn't ended before filter starts)
      conditions.push({
        end_date: {
          gte: startOfDay,
        },
      });
    }
  }

  if (endDate) {
    const endOfDay = parseToEndOfDay(endDate, 'endDate');
    if (endOfDay) {
      // Request start_date must be <= filter end date (request hasn't started after filter ends)
      conditions.push({
        start_date: {
          lte: endOfDay,
        },
      });
    }
  }

  return conditions;
}

/**
 * Validates that end date is not before start date
 * @param startDate - Start date string or Date
 * @param endDate - End date string or Date
 * @throws BadRequestException if end date is before start date
 */
export function validateDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
): void {
  if (!startDate || !endDate) return;

  const start = parseAndValidateDate(startDate, 'startDate');
  const end = parseAndValidateDate(endDate, 'endDate');

  if (start && end && end < start) {
    throw new BadRequestException('End date cannot be before start date');
  }
}
