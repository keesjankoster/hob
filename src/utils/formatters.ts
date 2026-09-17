import pc from "picocolors";

/**
 * Terminal UI and data formatting utilities
 */

/**
 * Renders an ASCII color-coded progress bar based on percentage.
 * Thresholds:
 *   >= 75% : Green (Salesforce deployment minimum)
 *   60-74% : Yellow (Caution)
 *   < 60%  : Red (Critical)
 */
export function renderProgressBar(percent: number, width: number = 20): string {
  const clamped = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;

  const barChars = "█".repeat(filled) + "░".repeat(empty);

  if (clamped >= 75) {
    return pc.green(barChars);
  }
  if (clamped >= 60) {
    return pc.yellow(barChars);
  }
  return pc.red(barChars);
}

/**
 * Formats a percentage value with color coding
 */
export function formatPercentage(percent: number): string {
  const clamped = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  const text = `${Math.round(clamped)}%`.padStart(4);
  if (clamped >= 75) {
    return pc.bold(pc.green(text));
  }
  if (clamped >= 60) {
    return pc.bold(pc.yellow(text));
  }
  return pc.bold(pc.red(text));
}

/**
 * Formats execution duration into human-readable ms or seconds
 */
export function formatDuration(ms: number): string {
  if (isNaN(ms) || ms < 0) return "0ms";
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Collapses an array of line numbers into formatted ranges (e.g. 12, 15-18, 22)
 */
export function formatUncoveredLines(lines: number[]): string {
  if (!lines || lines.length === 0) {
    return pc.dim("None");
  }

  const sorted = Array.from(new Set(lines)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);

  return ranges.join(", ");
}
