/**
 * Shared error handling utilities for consistent error parsing and display
 */

/** Structure for Zod validation errors */
export interface ZodValidationErrors {
  [field: string]: string[];
}

/** Possible error types from action responses */
export type ActionError = string | ZodValidationErrors;

/**
 * Parses an error from an action response into a human-readable message.
 * Handles various error formats:
 * - String errors
 * - Zod validation errors (object with field arrays)
 * - JSON-encoded error strings
 *
 * @param error - The error from an action response
 * @param fallbackMessage - Message to show if error cannot be parsed
 * @returns A human-readable error message
 *
 * @example
 * ```ts
 * // String error
 * parseActionError("Something went wrong") // "Something went wrong"
 *
 * // Zod validation error
 * parseActionError({ email: ["Invalid email"] }) // "Invalid email"
 *
 * // JSON string error
 * parseActionError('{"message":"API error"}') // "API error"
 * ```
 */
export function parseActionError(
  error: ActionError | undefined | null,
  fallbackMessage = "An unexpected error occurred"
): string {
  if (!error) {
    return fallbackMessage;
  }

  // Handle Zod validation errors (object with arrays of messages)
  if (typeof error === "object") {
    const firstError = Object.values(error)[0]?.[0];
    return firstError || fallbackMessage;
  }

  // Try to parse JSON string errors
  if (typeof error === "string") {
    try {
      const parsedError = JSON.parse(error);
      if (parsedError.message) {
        return parsedError.message;
      }
      if (parsedError.error) {
        return parsedError.error;
      }
    } catch {
      // Not JSON, use the string as-is
    }
    return error;
  }

  return fallbackMessage;
}

/**
 * Extracts all validation errors from a Zod validation error object.
 * Useful when you want to display errors for each field.
 *
 * @param errors - The Zod validation errors object
 * @returns Array of {field, message} objects
 *
 * @example
 * ```ts
 * const errors = { email: ["Invalid email"], password: ["Too short"] };
 * getValidationErrors(errors)
 * // [{ field: "email", message: "Invalid email" }, { field: "password", message: "Too short" }]
 * ```
 */
export function getValidationErrors(
  errors: ZodValidationErrors
): Array<{ field: string; message: string }> {
  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => ({ field, message }))
  );
}

/**
 * Type guard to check if an error is a Zod validation error object
 */
export function isValidationError(
  error: ActionError | undefined | null
): error is ZodValidationErrors {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === "object" &&
    !Array.isArray(error)
  );
}

/**
 * Creates a standardized error response object for actions
 *
 * @param message - The error message
 * @param status - HTTP status code (defaults to 400)
 * @returns Error response object
 */
export function createErrorResponse(
  message: string,
  status = 400
): { error: string; status: number } {
  return { error: message, status };
}

/**
 * Safely extracts an error message from any error type
 *
 * @param error - Any error value
 * @param fallbackMessage - Message to show if error cannot be parsed
 * @returns A human-readable error message
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallbackMessage;
}
