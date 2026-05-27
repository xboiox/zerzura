import { Webhook } from 'svix';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { userProfileTable } from '@/models/Schema';
import { createDbConnection } from '@/utils/DBConnection';

export async function POST(req: Request) {
  const webhookSecret = Env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);
  let rawPayload: unknown;

  try {
    rawPayload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch {
    logger.warn('Clerk webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  if (
    typeof rawPayload !== 'object' ||
    rawPayload === null ||
    !('type' in rawPayload) ||
    !('data' in rawPayload)
  ) {
    return new Response('Invalid webhook payload', { status: 400 });
  }

  const { type, data } = rawPayload as { type: unknown; data: unknown };

  if (
    type === 'user.created' &&
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof data.id === 'string'
  ) {
    const db = createDbConnection();
    await db.insert(userProfileTable).values({ clerkId: data.id }).onConflictDoNothing();
    logger.info(`UserProfile created for clerk user: ${data.id}`);
  }

  return new Response('OK', { status: 200 });
}
