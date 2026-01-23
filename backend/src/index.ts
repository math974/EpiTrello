import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors, { type CorsOptions } from 'cors';
import express from 'express';
import { resolvers, typeDefs } from './graphql/index.js';
import { buildContext } from './middleware/auth.js';
import { prisma } from './prisma.js';

const app = express();

const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = async () => {
  await server.start();

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  app.use(
    '/graphql',
    cors(corsOptions),
    express.json(),
    expressMiddleware(server, { context: buildContext })
  );

  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server prêt sur http://localhost:${PORT}/graphql`);
  });
};

startServer().catch((error) => {
  console.error('❌ Erreur au démarrage du serveur :', error);
  process.exit(1);
});

