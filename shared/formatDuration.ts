/**
 * Formats a duration given in ticks (where 1 tick = 100 nanoseconds) into a human-readable string.
 * The output is in the format "{hours}h {minutes}m".
 *
 * @param runTimeTicks - The duration in ticks to format. If undefined or falsy, returns an empty string.
 * @returns A formatted string representing the duration in hours and minutes, or an empty string if input is invalid.
 */
export function formatDuration(runTimeTicks?: number): string {
    if (!runTimeTicks) return '';
    const totalSeconds = Math.round(runTimeTicks / 10_000_000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}
