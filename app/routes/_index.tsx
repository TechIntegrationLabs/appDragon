import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { json } from '@remix-run/cloudflare';
import type { LoaderFunction } from '@remix-run/cloudflare';
import { ActivityLog } from '~/components/multiagent/ActivityLog';
import { Alert } from '~/components/ui/Alert';
import { Spinner } from '~/components/ui/Spinner';

export const loader: LoaderFunction = async ({ request }) => {
  return json({ id: undefined });
};

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
}

export default function Index() {
  const [userRequest, setUserRequest] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMultiAgent, setShowMultiAgent] = useState(false);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState<ErrorState | null>(null);

  const parseErrorMessage = (error: any): ErrorState => {
    if (error?.status === 'partial') {
      return {
        message: error.error || 'Some steps completed successfully, but others failed.',
        type: 'warning'
      };
    }
    if (typeof error === 'string' && error.includes('overloaded')) {
      return {
        message: 'The service is experiencing high load. We will automatically retry your request.',
        type: 'warning'
      };
    } else if (error?.message?.includes('429') || error?.message?.includes('529')) {
      return {
        message: 'The service is temporarily unavailable. Please try again in a few moments.',
        type: 'warning'
      };
    }
    return {
      message: 'An unexpected error occurred. Please try again.',
      type: 'error'
    };
  };

  async function handleMultiAgentSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    // Add initial activity
    addActivity('Orchestrator', 'Starting multi-agent workflow');
    addActivity('Planner', 'Analyzing user request: ' + userRequest);

    const formData = new FormData();
    formData.append('userRequest', userRequest);

    try {
      const res = await fetch('/api/multiagent', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(responseText);
      }

      if (data.error) {
        const errorState = parseErrorMessage(data);
        setError(errorState);
        addActivity('System', errorState.message);
        
        // For partial successes, still show the results
        if (data.status === 'partial') {
          setResult(data);
          data.completedSteps.forEach(step => {
            switch(step) {
              case 'planning':
                addActivity('Planner', 'Generated execution plan');
                break;
              case 'coding':
                addActivity('Coder', 'Generated code changes');
                break;
              case 'testing':
                addActivity('Tester', 'Completed testing');
                break;
            }
          });
        }
      } else {
        setResult(data);
        addActivity('Planner', 'Generated execution plan');
        addActivity('Coder', 'Implemented code changes');
        addActivity('Tester', 'Verified changes');
      }
    } catch (error) {
      const errorState = parseErrorMessage(error);
      setError(errorState);
      addActivity('System', 'Failed to process request: ' + errorState.message);
    } finally {
      setLoading(false);
    }
  }

  function addActivity(agent, action) {
    setActivities(prev => [...prev, {
      agent,
      action,
      timestamp: Date.now()
    }]);
  }

  // Clear states when closing the panel
  useEffect(() => {
    if (!showMultiAgent) {
      setActivities([]);
      setError(null);
      setResult(null);
      setUserRequest('');
    }
  }, [showMultiAgent]);

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      
      {/* Multi-agent toggle button */}
      <div className="flex justify-end p-2 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 relative z-50">
        <button
          onClick={() => setShowMultiAgent(!showMultiAgent)}
          className={`px-4 py-2 rounded transition-colors duration-200 ${
            showMultiAgent ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Multi-Agent Panel
        </button>
      </div>

      {/* Multi-agent panel */}
      {showMultiAgent && (
        <div className="border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 relative z-40">
          <div className="flex">
            <div className="flex-1">
              <div className="max-w-4xl mx-auto p-4 space-y-4">
                {error && (
                  <Alert type={error.type} onClose={() => setError(null)}>
                    {error.message}
                  </Alert>
                )}

                <form onSubmit={handleMultiAgentSubmit} className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="Ask the multi-agent system to improve the code..."
                    className="flex-1 p-2 border rounded bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary border-bolt-elements-borderColor focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !userRequest.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 min-w-[120px] hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Spinner className="w-4 h-4" />
                        Running...
                      </>
                    ) : (
                      'Run Agents'
                    )}
                  </button>
                </form>

                {result && (
                  <div className="mt-4 space-y-4 bg-bolt-elements-background-depth-2 rounded p-4 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-4">
                      {result.plan && (
                        <div>
                          <h2 className="text-sm font-semibold text-bolt-elements-textSecondary mb-2">Plan</h2>
                          <pre className="text-xs whitespace-pre-wrap text-bolt-elements-textPrimary overflow-x-auto max-h-[400px] overflow-y-auto p-2 bg-bolt-elements-background-depth-3 rounded">{result.plan}</pre>
                        </div>
                      )}
                      {result.codeChanges && (
                        <div>
                          <h2 className="text-sm font-semibold text-bolt-elements-textSecondary mb-2">Code Changes</h2>
                          <pre className="text-xs whitespace-pre-wrap text-bolt-elements-textPrimary overflow-x-auto max-h-[400px] overflow-y-auto p-2 bg-bolt-elements-background-depth-3 rounded">{result.codeChanges}</pre>
                        </div>
                      )}
                      {result.testResults && (
                        <div>
                          <h2 className="text-sm font-semibold text-bolt-elements-textSecondary mb-2">Test Results</h2>
                          <pre className="text-xs whitespace-pre-wrap text-bolt-elements-textPrimary overflow-x-auto max-h-[400px] overflow-y-auto p-2 bg-bolt-elements-background-depth-3 rounded">{result.testResults}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Activity Log */}
            <div className="w-80 border-l border-bolt-elements-borderColor">
              <ActivityLog activities={activities} />
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 overflow-hidden relative z-30">
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      </div>
    </div>
  );
}