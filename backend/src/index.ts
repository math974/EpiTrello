import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors, { type CorsOptions } from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { resolvers } from './schema/resolvers.js';
import { typeDefs } from './schema/typeDefs.js';

const app = express();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI manquant dans la configuration');
  }

  await mongoose.connect(uri);
  console.log('✅ MongoDB connecté');
};

const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = async () => {
  await connectDB();
  await server.start();

  app.use('/graphql', cors(corsOptions), express.json(), expressMiddleware(server));

  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server prêt sur http://localhost:${PORT}/graphql`);
  });
};

startServer().catch((error) => {
  console.error('❌ Erreur au démarrage du serveur :', error);
  process.exit(1);
});

