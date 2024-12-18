// app/routes/api.multiagent.tsx
import type { ActionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { runMultiAgentFlow } from '~/agents/orchestrator.server';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const userRequest = formData.get('userRequest')?.toString();

  if (!userRequest) {
    return json(
      { error: 'User request is required' },
      { status: 400 }
    );
  }

  try {
    const result = await runMultiAgentFlow(userRequest);

    if (result.status === 'error') {
      return json(
        { 
          error: result.error || 'An unexpected error occurred',
          status: result.status
        },
        { status: 500 }
      );
    }

    return json({
      ...result,
      error: result.status === 'partial' ? result.error : undefined
    });
  } catch (error) {
    console.error('Error in multiagent API:', error);
    return json(
      { 
        error: error.message,
        status: 'error'
      },
      { status: 500 }
    );
  }
}
