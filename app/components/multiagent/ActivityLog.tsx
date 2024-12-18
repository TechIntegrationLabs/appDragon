import { memo } from 'react';

interface ActivityLogProps {
  activities: Array<{
    agent: string;
    action: string;
    timestamp: number;
  }>;
}

export const ActivityLog = memo(({ activities }: ActivityLogProps) => {
  return (
    <div className="bg-bolt-elements-background-depth-2 border-l border-bolt-elements-borderColor p-4 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-bolt-elements-textSecondary mb-4">Agent Activity Log</h2>
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div key={index} className="text-xs">
            <span className="text-bolt-elements-textTertiary">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
            <span className="mx-2 text-bolt-elements-textSecondary font-medium">
              {activity.agent}:
            </span>
            <span className="text-bolt-elements-textPrimary">{activity.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
