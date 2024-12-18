// app/routes/api.multiagent.tsx
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { runMultiAgentFlow } from '~/agents/orchestrator.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MultiAgentAPI');

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userRequest = formData.get('userRequest')?.toString();

  if (!userRequest) {
    logger.warn('Missing user request');
    return json(
      { error: 'User request is required' },
      { status: 400 },
    );
  }

  try {
    logger.info('Processing request:', userRequest);
    const result = await runMultiAgentFlow(userRequest);

    if (result.status === 'error') {
      logger.error('Multi-agent flow failed:', result.error);
      return json(
        {
          error: result.error || 'An unexpected error occurred',
          status: result.status,
        },
        { status: 500 },
      );
    }

    logger.info('Request processed successfully:', {
      status: result.status,
      completedSteps: result.completedSteps,
    });

    return json({
      ...result,
      error: result.status === 'partial' ? result.error : undefined,
    });
  } catch (error: unknown) {
    logger.error('Unexpected error in multi-agent API:', error);
    return json(
      {
        error: (error as Error).message || 'An unexpected error occurred',
        status: 'error',
      },
      { status: 500 },
    );
  }
};
