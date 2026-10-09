export function relative(timestamp: number): string {
    const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);

    if (Math.abs(elapsedSeconds) < 60) {
        return "now";
    }

    const cutoffs = [
        { limit: 3600, seconds: 60, unit: "m" },
        { limit: 86400, seconds: 3600, unit: "h" },
        { limit: 604800, seconds: 86400, unit: "d" },
        { limit: 2592000, seconds: 604800, unit: "w" },
        { limit: 31536000, seconds: 2592000, unit: "mo" },
        { limit: Infinity, seconds: 31536000, unit: "y" },
    ];

    for (const cutoff of cutoffs) {
        if (Math.abs(elapsedSeconds) < cutoff.limit) {
            const value = Math.floor(Math.abs(elapsedSeconds) / cutoff.seconds);
            return `${value}${cutoff.unit}`;
        }
    }

    return "now";
}