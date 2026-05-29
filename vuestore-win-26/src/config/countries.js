/**
 * Country configuration
 * Centralized country list for consistent usage across the application
 * This follows industry best practices for managing static configuration data
 */

export const COUNTRIES = [
  // { code: 'TH', name: 'Thailand' },
  { code: 'CN', name: '中国大陆' },
  { code: 'HK', name: '港澳台' },
  // { code: 'US', name: 'United States' },
  { code: 'VN', name: '其它国家/地区' },
  // Add more countries as needed
]

/**
 * Get country by code
 * @param {string} code - Country code
 * @returns {Object|null} Country object or null if not found
 */
export function getCountryByCode(code) {
  return COUNTRIES.find(country => country.code === code) || null
}

/**
 * Get country name by code
 * @param {string} code - Country code
 * @returns {string|null} Country name or null if not found
 */
export function getCountryName(code) {
  const country = getCountryByCode(code)
  return country ? country.name : null
}

/**
 * Get all country codes
 * @returns {string[]} Array of country codes
 */
export function getAllCountryCodes() {
  return COUNTRIES.map(country => country.code)
}

/**
 * Get all country names
 * @returns {string[]} Array of country names
 */
export function getAllCountryNames() {
  return COUNTRIES.map(country => country.name)
}

/**
 * Check if country code exists
 * @param {string} code - Country code to check
 * @returns {boolean} True if country exists
 */
export function countryExists(code) {
  return COUNTRIES.some(country => country.code === code)
}