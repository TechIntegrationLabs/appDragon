// app/agents/orchestrator.server.ts
import { anthropicStream } from '~/utils/anthropic-stream';
import { plannerPrompt, coderPrompt, testerPrompt } from './prompts';
import { getAllFilesWithContent, writeFile } from '~/utils/webcontainer';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MultiAgent');

interface OrchestrationResult {
  plan: string | null;
  codeChanges: string | null;
  testResults: string | null;
  status: 'success' | 'partial' | 'error';
  error?: string;
  completedSteps: string[];
}

// parse code changes from coder's response
function parseFileChanges(response: string): { path: string; content: string }[] {
  const updates: { path: string; content: string }[] = [];

  // split by file sections
  const fileSections = response.split(/\bFILE:\s+/).slice(1);

  for (const section of fileSections) {
    try {
      const lines = section.trim().split('\n');
      const filePath = lines[0].trim();

      // find code block markers
      const codeStart = lines.findIndex((line) => line.trim().startsWith('```'));
      const codeEnd = lines.findIndex((line, i) => i > codeStart && line.trim().startsWith('```'));

      if (codeStart !== -1 && codeEnd !== -1) {
        // extract content between markers, removing language identifier
        const content = lines
          .slice(codeStart + 1, codeEnd)
          .join('\n')
          .replace(/^```\w*\n/, '');

        updates.push({ path: filePath, content });
      }
    } catch (error) {
      console.error('error parsing file section:', error);
      // continue parsing other sections
    }
  }

  return updates;
}

// format current files for the prompt
function formatCurrentFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([path, content]) => `FILE: ${path}\n${content}`)
    .join('\n\n');
}

// helper to call anthropic with retry logic
async function callAnthropic(prompt: string, retryCount = 0): Promise<string> {
  try {
    const response = await anthropicStream({
      prompt,
      max_tokens_to_sample: 2000,
      model: 'claude-2',
      temperature: 0,
    });

    return response;
  } catch (error: any) {
    if (error.message.includes('overloaded') && retryCount < 2) {
      console.log(`retrying step (attempt ${retryCount + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return callAnthropic(prompt, retryCount + 1);
    }

    throw error;
  }
}

export async function runMultiAgentFlow(userRequest: string): Promise<OrchestrationResult> {
  const result: OrchestrationResult = {
    plan: null,
    codeChanges: null,
    testResults: null,
    status: 'error',
    completedSteps: [],
  };

  try {
    logger.info('Starting multi-agent workflow for request:', userRequest);
    
    // get current codebase
    const currentFiles = await getAllFilesWithContent();
    const currentCode = formatCurrentFiles(currentFiles);
    logger.debug('Retrieved current codebase files');

    // step 1: planning
    logger.info('Starting planning phase...');
    const plannerPromptText = plannerPrompt(userRequest);
    result.plan = await callAnthropic(plannerPromptText);
    result.completedSteps.push('planning');
    logger.info('Planning phase completed');

    // step 2: coding
    logger.info('Starting coding phase...');
    const coderPromptText = coderPrompt(userRequest, result.plan, currentCode);
    result.codeChanges = await callAnthropic(coderPromptText);
    result.completedSteps.push('coding');
    logger.info('Coding phase completed');

    // apply code changes
    const updates = parseFileChanges(result.codeChanges);
    logger.debug('Parsed code changes:', { numUpdates: updates.length });

    for (const { path, content } of updates) {
      await writeFile(path, content);
      logger.debug('Applied changes to file:', path);
    }

    // step 3: testing
    logger.info('Starting testing phase...');
    const updatedFiles = await getAllFilesWithContent();
    const updatedCode = formatCurrentFiles(updatedFiles);
    const testerPromptText = testerPrompt(userRequest, result.plan, updatedCode);
    result.testResults = await callAnthropic(testerPromptText);
    result.completedSteps.push('testing');
    logger.info('Testing phase completed');

    result.status = 'success';
    logger.info('Multi-agent workflow completed successfully');
  } catch (error) {
    logger.error('Error in multi-agent workflow:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = result.completedSteps.length > 0 ? 'partial' : 'error';
  }

  return result;
}
