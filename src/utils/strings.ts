/**
 * Pure string transformation utilities
 */

export function toPascalCase(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
  return str
    .replace(/_+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function normalizeSObjectName(input: string): string {
  if (input.endsWith("__c")) {
    const base = input.slice(0, -3);
    return base.charAt(0).toUpperCase() + base.slice(1) + "__c";
  }
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function deriveBaseName(sobject: string): string {
  if (sobject.endsWith("__c")) {
    const base = sobject.slice(0, -3);
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  if (sobject.endsWith("__mdt")) {
    const base = sobject.slice(0, -5);
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return sobject.charAt(0).toUpperCase() + sobject.slice(1);
}

export function pluralize(str: string): string {
  if (!str) return "";
  if (str.endsWith("s") || str.endsWith("x") || str.endsWith("z") || str.endsWith("ch") || str.endsWith("sh")) {
    return `${str}es`;
  }
  if (str.endsWith("y") && !/[aeiou]y$/i.test(str)) {
    return `${str.slice(0, -1)}ies`;
  }
  return `${str}s`;
}

export function normalizeCustomObjectName(name: string): string {
  if (!name) return "";
  const cleaned = name.replace(/\s+/g, "_");
  if (cleaned.endsWith("__c")) {
    return cleaned;
  }
  return `${cleaned}__c`;
}

export function normalizeFieldName(name: string): string {
  if (!name) return "";
  const cleaned = name.replace(/\s+/g, "_");
  if (cleaned.endsWith("__c")) {
    return cleaned;
  }
  return `${cleaned}__c`;
}

export function normalizeCmdtName(name: string): string {
  if (!name) return "";
  const cleaned = name.replace(/\s+/g, "_");
  if (cleaned.endsWith("__mdt")) {
    return cleaned;
  }
  return `${cleaned}__mdt`;
}

const STANDARD_OBJECTS = new Set([
  "Account",
  "Contact",
  "Lead",
  "Opportunity",
  "Case",
  "Task",
  "Event",
  "User",
  "Asset",
  "Campaign",
  "Contract",
  "Order",
  "Product2",
  "Solution",
  "Pricebook2",
  "PricebookEntry",
  "UserRole",
  "Profile",
  "PermissionSet",
  "Group"
]);

export function isStandardObject(name: string): boolean {
  return STANDARD_OBJECTS.has(name);
}

/**
 * Validates whether a string is a valid Salesforce identifier.
 * Must start with an ASCII letter, followed by alphanumeric characters or underscores.
 * Cannot contain path traversal characters (../), spaces, or symbols.
 */
export function isValidSalesforceIdentifier(str: string): boolean {
  if (!str) return false;
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(str);
}

/**
 * Validates an sObject, Custom Object, Custom Field, or Custom Metadata Type name.
 * Allows standard names (Account) or custom names ending with __c or __mdt.
 */
export function isValidSObjectName(str: string): boolean {
  if (!str) return false;
  const base = deriveBaseName(str);
  return isValidSalesforceIdentifier(base);
}

/**
 * Validates a Lightning Web Component bundle name.
 * LWC bundle names cannot contain underscores or hyphens, must start with an ASCII letter.
 */
export function isValidLwcName(str: string): boolean {
  if (!str) return false;
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Validates a Salesforce DX project name (directory name).
 * Must be a safe directory name without path separators or traversal.
 */
export function isValidProjectName(str: string): boolean {
  if (!str) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(str) && !str.includes("..");
}

