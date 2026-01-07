/**
 * Converts a value in bytes to megabytes (MB).
 * * Note: Uses the standard base-1024 convention (1 MB = 1024 * 1024 bytes).
 * * @param bytes The size in bytes (number).
 * @param decimalPlaces The number of decimal places to round the result to (default is 2).
 * @returns The converted size in megabytes (MB).
 */
export function bytesToMB(bytes: number, decimalPlaces: number = 2): number {
    // Check if the input is a valid non-negative number
    if (typeof bytes !== 'number' || bytes < 0) {
        console.error("Invalid input: Bytes must be a non-negative number.");
        return 0;
    }

    // Define the conversion constant (1 MB = 1024 * 1024 bytes)
    const MEGABYTE_CONVERSION_FACTOR = 1024 * 1024; // 1,048,576

    // Calculate the value in MB
    const megabytes = bytes / MEGABYTE_CONVERSION_FACTOR;

    // Round the result to the specified number of decimal places
    const factor = Math.pow(10, decimalPlaces);
    
    // Use Math.round for precise rounding
    return Math.round(megabytes * factor) / factor;
}