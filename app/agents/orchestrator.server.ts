// app/agents/orchestrator.server.ts
import { anthropicStream } from '~/utils/anthropic-stream';
import { plannerPrompt, coderPrompt, testerPrompt } from './prompts';
import { getAllFiles, writeFile } from '~/utils/webcontainer';

interface OrchestrationResult {
  plan: string | null;
  codeChanges: string | null;
  testResults: string | null;
  status: 'success' | 'partial' | 'error';
  error?: string;
  completedSteps: string[];
}

// Parse code changes from coder's response
function parseFileChanges(response: string): { path: string, content: string }[] {
  const updates: {path: string, content: string}[] = [];

  // Split by FILE: sections
  const fileSections = response.split(/\bFILE:\s+/).slice(1);
  
  for (const section of fileSections) {
    try {
      const lines = section.trim().split('\n');
      const filePath = lines[0].trim();
      
      // Find code block markers
      const codeStart = lines.findIndex(line => line.trim().startsWith('```'));
      const codeEnd = lines.findIndex((line, i) => i > codeStart && line.trim().startsWith('```'));
      
      if (codeStart !== -1 && codeEnd !== -1) {
        // Extract content between markers, removing the language identifier
        const content = lines
          .slice(codeStart + 1, codeEnd)
          .join('\n')
          .replace(/^```\w*\n/, '');
        
        updates.push({ path: filePath, content });
      }
    } catch (error) {
      console.error('Error parsing file section:', error);
      // Continue parsing other sections
    }
  }

  return updates;
}

// Format current files for the prompt
function formatCurrentFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([path, content]) => `FILE: ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');
}

// Helper to call Anthropic with a given prompt
async function callAnthropic(prompt: string, retryCount = 0): Promise<string> {
  try {
    const response = await anthropicStream({
      prompt,
      max_tokens_to_sample: 2000,
      model: "claude-2",
      temperature: 0,
    });

    return response.trim();
  } catch (error: any) {
    if (error.message.includes('overloaded') && retryCount < 2) {
      console.log(`Retrying step (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
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
    completedSteps: []
  };

  try {
    // 1. Planner
    console.log('Running planner...');
    const planPromptText = plannerPrompt(userRequest);
    result.plan = await callAnthropic(planPromptText);
    result.completedSteps.push('planning');

    // 2. Coder
    // Get current codebase state
    console.log('Fetching current code...');
    const currentFiles = await getAllFiles();
    const currentCode = formatCurrentFiles(currentFiles);

    console.log('Running coder...');
    const coderPromptText = coderPrompt(userRequest, result.plan, currentCode);
    result.codeChanges = await callAnthropic(coderPromptText);
    result.completedSteps.push('coding');

    // Apply code changes
    console.log('Applying code changes...');
    const updates = parseFileChanges(result.codeChanges);
    for (const {path, content} of updates) {
      await writeFile(path, content);
    }

    // 3. Tester
    console.log('Running tester...');
    // Get updated codebase state
    const updatedFiles = await getAllFiles();
    const updatedCode = formatCurrentFiles(updatedFiles);

    const testerPromptText = testerPrompt(userRequest, result.plan, result.codeChanges);
    result.testResults = await callAnthropic(testerPromptText);
    result.completedSteps.push('testing');

    // All steps completed successfully
    result.status = 'success';
  } catch (error: any) {
    console.error('Error in multi-agent flow:', error);
    
    // Set status based on how far we got
    result.status = result.completedSteps.length > 0 ? 'partial' : 'error';
    result.error = error.message;

    // If we have a partial success, provide helpful context
    if (result.status === 'partial') {
      const lastStep = result.completedSteps[result.completedSteps.length - 1];
      if (lastStep === 'planning') {
        result.error = 'Generated plan but encountered an error during code generation. You can try again or implement the plan manually.';
      } else if (lastStep === 'coding') {
        result.error = 'Generated code changes but encountered an error during testing. You may want to review the changes carefully before implementing.';
      }
    }
  }

  return result;
}
