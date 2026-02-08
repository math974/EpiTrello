import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getAccessToken } from './tokenStore';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:4000/graphql',
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

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  devtools: { enabled: false },
});

