import fp from 'fastify-plugin';
import websocketPlugin from '@fastify/websocket';
import { ConnectionRegistry } from '../ws/registry.js';

export default fp(async (fastify) => {
  await fastify.register(websocketPlugin);
  fastify.decorate('wsRegistry', new ConnectionRegistry());
});
