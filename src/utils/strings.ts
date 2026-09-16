/**
 * Pure string transformation utilities
 */

export function toPascalCase(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
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
  return sobject.charAt(0).toUpperCase() + sobject.slice(1);
}
