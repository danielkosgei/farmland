/**
 * Utility functions for text formatting
 */

/**
 * Formats a string by replacing underscores with spaces and capitalizing each word
 * @param {string} str - The string to format
 * @returns {string} - The formatted string in title case
 */
export const formatLabel = (str) => {
    if (!str) return '-';
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};
