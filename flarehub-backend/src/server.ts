import { buildApp } from './app.js';
import { appConfig } from './config/index.js';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: appConfig.port, host: '0.0.0.0' });
    app.log.info(`Server running on port ${appConfig.port}`);
    app.log.info(`Environment: ${appConfig.nodeEnv}`);

    // Start WebSocket heartbeat — cleans up dead connections every 30s
    const heartbeatTimer = app.wsRegistry.startHeartbeat(30_000);

    const shutdown = async () => {
      clearInterval(heartbeatTimer);
      await app.close();
      process.exit(0);
    };

    process.on('SIGINT',  shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

