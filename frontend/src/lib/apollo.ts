import { ApolloClient, InMemoryCache, HttpLink, from, ApolloError } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Observable } from '@apollo/client/utilities';
import { print } from 'graphql';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';
import { REFRESH_TOKEN_MUTATION } from './auth.graphql';

// Check if we're in the browser (client-side)
const isBrowser = typeof window !== 'undefined';

// Dynamic import for onError to avoid SSR issues
let onError: any;
if (isBrowser) {
  try {
    // @ts-ignore - Dynamic import for onError
    const errorModule = require('@apollo/client/link/error');
    onError = errorModule.onError;
  } catch (e) {
    console.warn('Failed to load onError:', e);
  }
}

const graphqlUri = process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:4000/graphql';

// Log the GraphQL URI in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 GraphQL API endpoint:', graphqlUri);
}

const httpLink = new HttpLink({
  uri: graphqlUri,
  credentials: 'include', // Include cookies for refresh token handling
});

// Auth link to add Authorization header with access token
const authLink = setContext((_, { headers }) => {
  const token = getAccessToken();
  
  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Create a simple HTTP client for refresh (to avoid circular dependency)
// Uses cookie automatically via credentials: 'include'
const refreshToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Attempting to refresh token via cookie...');
    const response = await fetch(graphqlUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies (refreshToken is in httpOnly cookie)
      body: JSON.stringify({
        query: print(REFRESH_TOKEN_MUTATION),
        variables: {
          input: {}, // Empty input - will use cookie
        },
      }),
    });

    if (!response.ok) {
      console.error('❌ Refresh token request failed:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors during refresh:', result.errors);
      return null;
    }
    
    if (result.data?.refreshToken?.accessToken) {
      console.log('✅ Token refreshed successfully');
      return result.data.refreshToken.accessToken;
    }
    
    console.warn('⚠️ No access token in refresh response:', result);
    return null;
  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
    return null;
  }
};

// Error link to handle token refresh on 401 errors
// Only create error link on client-side (Next.js SSR compatibility)
let errorLink: any;

if (isBrowser && onError && typeof onError === 'function') {
  console.log('✅ Error link configured for automatic token refresh');
  // @ts-ignore - onError function signature compatibility
  errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    console.log('🔍 Error link triggered:', { 
      hasGraphQLErrors: !!graphQLErrors, 
      hasNetworkError: !!networkError,
      operationName: operation.operationName 
    });
    
    if (graphQLErrors) {
      console.log('📋 GraphQL errors:', graphQLErrors.map((e: any) => ({
        message: e.message,
        code: e.extensions?.code,
        originalError: e.extensions?.originalError,
        path: e.path
      })));
      
      // Do not try to refresh token on Login/Register — propagate error so form can show "Invalid credentials"
      const opName = operation?.operationName || '';
      if (opName === 'Login' || opName === 'Register') {
        return new Observable((observer) => {
          observer.error(new ApolloError({ graphQLErrors, networkError }));
        });
      }
      
      // Check for UNAUTHENTICATED or Unauthorized errors (e.g. expired access token)
      const isUnauthenticated = graphQLErrors.some(
        (err: any) => 
          err.extensions?.code === 'UNAUTHENTICATED' ||
          err.extensions?.code === 'Unauthorized' ||
          err.message === 'Unauthorized' ||
          (err.extensions?.originalError?.statusCode === 401)
      );

      if (isUnauthenticated) {
        console.log('🔐 UNAUTHENTICATED error detected, attempting automatic refresh...');
        // If we're already refreshing, queue this request
        if (isRefreshing) {
          return new Observable((observer) => {
            failedQueue.push({
              resolve: (token) => {
                // Update the operation context with the new token
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: token ? `Bearer ${token}` : '',
                  },
                });
                const subscriber = forward(operation).subscribe(observer);
                return () => subscriber.unsubscribe();
              },
              reject: (error) => {
                observer.error(error);
              },
            });
          });
        }

        isRefreshing = true;

        // Try to refresh the token using the cookie
        return new Observable((observer) => {
          refreshToken()
            .then((newToken) => {
              isRefreshing = false;

              if (newToken) {
                setAccessToken(newToken);

                // Update the operation context with the new token
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `Bearer ${newToken}`,
                  },
                });

                // Process queued requests
                processQueue(null, newToken);

                // Retry the original request
                const subscriber = forward(operation).subscribe({
                  next: observer.next.bind(observer),
                  error: observer.error.bind(observer),
                  complete: observer.complete.bind(observer),
                });

                return () => subscriber.unsubscribe();
              } else {
                // No token in response, clear and reject
                clearAccessToken();
                processQueue(new Error('Failed to refresh token'));
                observer.error(new Error('Failed to refresh token'));
              }
            })
            .catch((error) => {
              isRefreshing = false;
              clearAccessToken();
              processQueue(error);
              observer.error(error);
            });
        });
      }
    }

    if (networkError) {
      // Handle network errors if needed
      console.error('Network error:', networkError);
    }
  });
} else {
  // Fallback for SSR - no error handling needed
  errorLink = from([authLink, httpLink]);
}

// Build the link chain
// @ts-ignore - Type incompatibility due to multiple Apollo Client versions in node_modules
// @ts-ignore - onError may not be available in SSR
const link = isBrowser && onError && typeof onError === 'function'
  ? from([errorLink, authLink, httpLink])
  : from([authLink, httpLink]);

// @ts-ignore - Type incompatibility due to multiple Apollo Client versions in node_modules
// The code works correctly at runtime
export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
