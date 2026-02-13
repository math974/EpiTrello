import { apolloClient } from './apollo';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';
import {
  LoginDocument,
  RegisterDocument,
  MeDocument,
  LogoutDocument,
  LoginMutation,
  RegisterMutation,
  MeQuery,
  LogoutMutation,
  UserModel,
  AuthPayload,
} from '../generated/graphql';
import { UPDATE_USER_MUTATION, DELETE_ACCOUNT_MUTATION } from './auth.graphql';

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

/**
 * Logout the current user
 * @returns true if logout successful
 * @throws Error if logout fails
 */
export async function logout(): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<LogoutMutation>({
      mutation: LogoutDocument,
      variables: {
        input: {}, // Empty input - will use cookie
      },
      context: {
        credentials: 'include', // Include cookies for refresh token
      },
    });

    // Clear access token from localStorage
    clearAccessToken();

    return data?.logout ?? false;
  } catch (error: any) {
    // Even if logout fails on backend, clear local token
    clearAccessToken();
    throw error;
  }
}

export async function updateUser(input: { username?: string; email?: string; avatar?: string | null }): Promise<UserModel> {
  const payload = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  ) as { username?: string; email?: string; avatar?: string | null };
  const { data } = await apolloClient.mutate<{ updateUser: UserModel }>({
    mutation: UPDATE_USER_MUTATION,
    variables: { input: payload },
  });
  if (!data?.updateUser) throw new Error('Update profile failed');
  return data.updateUser;
}

export async function deleteAccount(): Promise<boolean> {
  const { data } = await apolloClient.mutate<{ deleteAccount: boolean }>({
    mutation: DELETE_ACCOUNT_MUTATION,
    context: { credentials: 'include' },
  });
  clearAccessToken();
  return data?.deleteAccount ?? false;
}

// Re-export types for convenience
export type { UserModel, AuthPayload, LoginInput, RegisterInput } from '../generated/graphql';

