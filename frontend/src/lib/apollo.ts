import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:4000/graphql',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  // Désactive la connexion automatique aux DevTools Apollo (certains vieux DevTools injectent encore l’option canonizeResults supprimée en 3.14).
  connectToDevTools: false,
});

