/**
 * Token storage utility for managing access tokens
 * Uses localStorage for persistence across page reloads
 */

const ACCESS_TOKEN_KEY = 'epitrello_access_token';

/**
 * Retrieve the stored access token
 * @returns The access token if present, null otherwise
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Store an access token
 * @param token The access token to store
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Remove the stored access token
 */
export function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

