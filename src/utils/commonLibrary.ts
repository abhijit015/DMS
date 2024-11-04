import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import { DataKeys } from "./types";

export function generateSecureToken(length: number): string {
  return randomBytes(length).toString("hex");
}

export function generateUUID(): string {
  return uuidv4();
}

export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return value instanceof Date || !isNaN(Date.parse(value));
    default:
      return false;
  }
}

export function validateDataKeys(
  schema: string | DataKeys,
  data: string
): { isValid: boolean; errors: string } {
  let errors: string[] = [];
  let isValid = true;
  let parsedSchema: DataKeys;
  let parsedData: Record<string, any>;

  if (typeof schema === "string") {
    try {
      parsedSchema = JSON.parse(schema) as DataKeys;
    } catch (error) {
      return {
        isValid: false,
        errors: "Invalid schema format. Please provide a valid JSON string.",
      };
    }
  } else {
    parsedSchema = schema;
  }

  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    return {
      isValid: false,
      errors: "Invalid meta data format. Please provide a valid JSON string.",
    };
  }

  const schemaKeys = Object.keys(parsedSchema);
  const dataKeys = Object.keys(parsedData);

  for (const key of dataKeys) {
    if (!schemaKeys.includes(key)) {
      isValid = false;
      errors.push(`Unexpected key: ${key} is not defined in the schema`);
    }
  }

  for (const key in parsedSchema) {
    const { type, required } = parsedSchema[key];

    if (required && !(key in parsedData)) {
      isValid = false;
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    if (key in parsedData) {
      const value = parsedData[key];
      const isTypeValid = validateType(value, type);
      if (!isTypeValid) {
        isValid = false;
        errors.push(
          `Invalid type for field: ${key}. Expected ${type}, but got ${typeof value}`
        );
      }
    }
  }

  return { isValid, errors: errors.join(". ") };
}
