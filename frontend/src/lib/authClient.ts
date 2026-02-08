import { apolloClient } from './apollo';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';
import {
  LoginDocument,
  RegisterDocument,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  MeQuery,
  UserModel,
  AuthPayload,
} from '../generated/graphql';

/**
 * Authenticate a user with email and password
 * @param email User email
 * @param password User password
 * @returns AuthPayload containing tokens and user data
 * @throws Error if authentication fails
 */
export async function login(email: string, password: string): Promise<AuthPayload> {
  try {
    const { data } = await apolloClient.mutate<LoginMutation>({
      mutation: LoginDocument,
      variables: {
        input: { email, password },
      },
      context: {
        // Don't send Authorization header for login
        headers: {},
      },
    });

    if (!data?.login) {
      throw new Error('Login failed: No data returned');
    }

    // Store the access token
    setAccessToken(data.login.accessToken);

    return data.login;
  } catch (error: any) {
    // Clear token on error
    clearAccessToken();
    throw error;
  }
}

/**
 * Register a new user
 * @param name User username
 * @param email User email
 * @param password User password
 * @returns AuthPayload containing tokens and user data
 * @throws Error if registration fails
 */
export async function register(name: string, email: string, password: string): Promise<AuthPayload> {
  try {
    const { data } = await apolloClient.mutate<RegisterMutation>({
      mutation: RegisterDocument,
      variables: {
        input: { username: name, email, password },
      },
      context: {
        // Don't send Authorization header for register
        headers: {},
      },
    });

    if (!data?.register) {
      throw new Error('Registration failed: No data returned');
    }

    // Store the access token
    setAccessToken(data.register.accessToken);

    return data.register;
  } catch (error: any) {
    // Clear token on error
    clearAccessToken();
    throw error;
  }
}

/**
 * Query the current authenticated user
 * @returns User data if authenticated, null otherwise
 * @throws Error if query fails
 */
export async function me(): Promise<UserModel | null> {
  try {
    const { data } = await apolloClient.query<MeQuery>({
      query: MeDocument,
      fetchPolicy: 'network-only', // Always fetch fresh data
    });

    return data?.me ?? null;
  } catch (error: any) {
    // If unauthorized, clear token
    if (error.graphQLErrors?.some((e: any) => e.extensions?.code === 'UNAUTHENTICATED')) {
      clearAccessToken();
    }
    throw error;
  }
}

// Re-export types for convenience
export type { UserModel, AuthPayload, LoginInput, RegisterInput } from '../generated/graphql';

