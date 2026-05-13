import fp from 'fastify-plugin';
import { supabaseAdmin } from '../lib/supabase.js';

export default fp(async (fastify) => {
  fastify.decorate('supabase', supabaseAdmin);
});
