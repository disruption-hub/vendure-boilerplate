/**
 * SKU (Stock Keeping Unit) Generator Utility
 * 
 * Generates standardized product codes based on category prefix and year.
 * Format: {PREFIX}{YY}-{SEQUENCE} e.g., ELE25-001
 */

/**
 * Default sequence length (number of digits)
 */
export const DEFAULT_SEQUENCE_LENGTH = 3

/**
 * Generate a standardized SKU code
 * @param categoryPrefix - 2-4 uppercase letter prefix from category
 * @param year - Full year (e.g., 2025)
 * @param sequence - Sequential number for this category/year
 * @param sequenceLength - Number of digits for sequence (default 3)
 * @returns Formatted SKU code like "ELE25-001"
 */
export function generateSkuCode(
    categoryPrefix: string,
    year: number,
    sequence: number,
    sequenceLength: number = DEFAULT_SEQUENCE_LENGTH
): string {
    const prefix = sanitizePrefix(categoryPrefix)
    const yearSuffix = String(year).slice(-2)
    const paddedSequence = String(sequence).padStart(sequenceLength, '0')

    return `${prefix}${yearSuffix}-${paddedSequence}`
}

/**
 * Sanitize and validate a category prefix
 * - Converts to uppercase
 * - Removes non-letter characters
 * - Truncates to 4 characters max
 * - Returns at least 2 characters (pads with 'X' if needed)
 */
export function sanitizePrefix(input: string): string {
    const cleaned = input.toUpperCase().replace(/[^A-Z]/g, '')
    if (cleaned.length < 2) {
        return (cleaned + 'XX').slice(0, 2)
    }
    return cleaned.slice(0, 4)
}

/**
 * Generate a prefix suggestion from a category name
 * Takes first letters of words, or first 3 characters if single word
 * @param categoryName - The category name
 * @returns Suggested 2-4 letter prefix
 */
export function suggestPrefixFromName(categoryName: string): string {
    const words = categoryName.trim().split(/\s+/).filter(Boolean)

    if (words.length >= 2) {
        // Use first letter of each word (up to 4 words)
        const prefix = words.slice(0, 4).map(w => w[0]).join('')
        return sanitizePrefix(prefix)
    }

    // Single word: take first 3 characters
    const singleWord = words[0] || 'PRD'
    return sanitizePrefix(singleWord.slice(0, 3))
}

/**
 * Extract the sequence number from an existing SKU code
 * @param sku - Full SKU code like "ELE25-001"
 * @param categoryPrefix - Expected category prefix
 * @returns Extracted sequence number, or null if doesn't match pattern
 */
export function extractSequenceFromSku(
    sku: string,
    categoryPrefix: string
): number | null {
    const prefix = sanitizePrefix(categoryPrefix)

    // Pattern: {PREFIX}{YY}-{SEQUENCE}
    const pattern = new RegExp(`^${prefix}\\d{2}-(\\d+)$`, 'i')
    const match = sku.match(pattern)

    if (match && match[1]) {
        return parseInt(match[1], 10)
    }

    return null
}

/**
 * Get the next sequence number for a category/year combination
 * Scans existing product codes to find the highest sequence and adds 1
 * 
 * @param existingCodes - Array of existing product codes
 * @param categoryPrefix - Category prefix to match
 * @param year - Year to match (full year like 2025)
 * @returns Next available sequence number (starts at 1)
 */
export function getNextSequence(
    existingCodes: string[],
    categoryPrefix: string,
    year: number
): number {
    const prefix = sanitizePrefix(categoryPrefix)
    const yearSuffix = String(year).slice(-2)

    // Pattern to match: {PREFIX}{YY}-{SEQUENCE}
    const pattern = new RegExp(`^${prefix}${yearSuffix}-(\\d+)$`, 'i')

    let maxSequence = 0

    for (const code of existingCodes) {
        const match = code.match(pattern)
        if (match && match[1]) {
            const seq = parseInt(match[1], 10)
            if (seq > maxSequence) {
                maxSequence = seq
            }
        }
    }

    return maxSequence + 1
}

/**
 * Validate if a prefix is valid (2-4 uppercase letters)
 */
export function isValidPrefix(prefix: string): boolean {
    return /^[A-Z]{2,4}$/.test(prefix)
}

/**
 * Generate a full SKU for a new product given category and existing products
 */
export function generateProductSku(
    categoryPrefix: string | undefined,
    categoryName: string,
    existingProductCodes: string[],
    year: number = new Date().getFullYear(),
    sequenceLength: number = DEFAULT_SEQUENCE_LENGTH
): string {
    // Use provided prefix or generate from category name
    const prefix = categoryPrefix || suggestPrefixFromName(categoryName)

    // Get next sequence
    const nextSeq = getNextSequence(existingProductCodes, prefix, year)

    // Generate the SKU
    return generateSkuCode(prefix, year, nextSeq, sequenceLength)
}
