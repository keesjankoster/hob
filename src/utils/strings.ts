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
