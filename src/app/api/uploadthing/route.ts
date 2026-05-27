import { createRouteHandler } from 'uploadthing/next';
import { Env } from '@/libs/Env';
import { uploadRouter } from '@/libs/Uploadthing';

function resolveToken(): string | undefined {
  if (Env.UPLOADTHING_TOKEN) {
    return Env.UPLOADTHING_TOKEN;
  }
  if (Env.UPLOADTHING_SECRET && Env.UPLOADTHING_APP_ID) {
    // v7 token format: base64(JSON { apiKey, appId, regions })
    // "fra1" is UploadThing's default region for apps created before v7
    return Buffer.from(
      JSON.stringify({
        apiKey: Env.UPLOADTHING_SECRET,
        appId: Env.UPLOADTHING_APP_ID,
        regions: ['fra1'],
      }),
    ).toString('base64');
  }
  return undefined;
}

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: { token: resolveToken() },
});
