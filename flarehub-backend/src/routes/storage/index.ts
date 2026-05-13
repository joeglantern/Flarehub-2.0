import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { signedUploadUrlSchema } from '../../schemas/admin.schema.js';
import {
  validateFileType,
  validateFileSize,
  isAllowedBucket,
  getSignedUploadUrl,
} from '../../services/storage.service.js';
import { AppError } from '../../types/index.js';

export default async function storageRoutes(fastify: FastifyInstance) {
  fastify.post('/storage/signed-upload-url', { preHandler: requireAuth }, async (request, reply) => {
    const { bucket, filename, mimeType, fileSize } = signedUploadUrlSchema.parse(request.body);

    if (!isAllowedBucket(bucket)) {
      throw new AppError('VALIDATION_ERROR', `Invalid bucket: ${bucket}`, 400);
    }

    validateFileType(mimeType, bucket);
    validateFileSize(fileSize, bucket);

    const result = await getSignedUploadUrl(fastify.supabase, bucket, filename, mimeType);

    return reply.send({ success: true, data: result });
  });
}
