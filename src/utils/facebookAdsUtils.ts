/**
 * Facebook Ads utility functions
 */

/**
 * Formats an ad account ID to include the "act_" prefix if not already present
 * @param adAccountId - The ad account ID (with or without "act_" prefix)
 * @returns The properly formatted ad account ID with "act_" prefix
 */
export function formatAdAccountId(adAccountId: string): string {
  if (!adAccountId) return '';
  
  // Remove any existing "act_" prefix and whitespace
  const cleanId = adAccountId.replace(/^act_/i, '').trim();
  
  // Add "act_" prefix
  return `act_${cleanId}`;
}

/**
 * Extracts the numeric part of an ad account ID (removes "act_" prefix)
 * @param adAccountId - The ad account ID (with or without "act_" prefix)
 * @returns The numeric part of the ad account ID
 */
export function extractAdAccountNumber(adAccountId: string): string {
  if (!adAccountId) return '';
  return adAccountId.replace('act_', '');
}

/**
 * Validates if an ad account ID is in the correct format
 * @param adAccountId - The ad account ID to validate
 * @returns True if the ad account ID is valid
 */
export function isValidAdAccountId(adAccountId: string): boolean {
  if (!adAccountId) return false;
  
  // Remove "act_" prefix if present
  const numericPart = extractAdAccountNumber(adAccountId);
  
  // Check if it's a valid numeric string (typically 10-15 digits)
  return /^\d{10,15}$/.test(numericPart);
}

/**
 * Creates a Facebook Marketing API URL with the properly formatted ad account ID
 * @param adAccountId - The ad account ID (with or without "act_" prefix)
 * @param endpoint - The API endpoint (e.g., "campaigns", "adsets", "ads")
 * @param version - The API version (default: "v21.0")
 * @returns The complete API URL
 */
export function createFacebookAdsApiUrl(
  adAccountId: string, 
  endpoint: string, 
  version: string = 'v21.0'
): string {
  // Don't add "act_" prefix if it's already there
  const formattedId = adAccountId.startsWith('act_') ? adAccountId : formatAdAccountId(adAccountId);
  
  // Debug logging to help identify double prefix issues
  if (formattedId.includes('act_act_')) {
    console.error('🚨 Double "act_" prefix detected!', {
      original: adAccountId,
      formatted: formattedId,
      endpoint
    });
  }
  
  return `https://graph.facebook.com/${version}/${formattedId}/${endpoint}`;
}