import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return json({ error: 'GitHub client ID not configured' }, { status: 500 });
  }

  // Generate a random state for security
  const state = Math.random().toString(36).substring(7);
  
  // GitHub OAuth authorization URL
  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.append('client_id', clientId);
  githubUrl.searchParams.append('state', state);
  githubUrl.searchParams.append('scope', 'repo'); // Request repository access

  // Store state in cookie for verification when GitHub redirects back
  const headers = new Headers();
  headers.append('Set-Cookie', `github_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  
  return new Response(null, {
    status: 302,
    headers: {
      ...Object.fromEntries(headers),
      Location: githubUrl.toString(),
    },
  });
};
