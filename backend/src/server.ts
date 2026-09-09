import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 PeoplePay360 Backend API running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📡 Health Check: http://localhost:${env.PORT}/health`);
  console.log(`📡 API V1: http://localhost:${env.PORT}${env.API_PREFIX}`);
});

// Graceful shutdown handlers
const shutdown = () => {
  console.log('🛑 Shutting down HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
