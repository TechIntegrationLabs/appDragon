import { useState } from 'react';
import { classNames } from '~/utils/classNames';

interface ButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ icon, label, onClick, disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
        'text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'border border-bolt-elements-borderColor'
      )}
      title={label}
    >
      <div className={icon} />
      <span>{label}</span>
    </button>
  );
}

export function AdditionalActions() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    // Create a zip file of the entire app
    // This will be implemented in a separate API endpoint
    window.location.href = '/api/download';
  };

  const handleGithubLink = () => {
    // Open GitHub OAuth flow in a new window
    window.open('/api/github/auth', 'github-oauth', 'width=600,height=800');
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mr-4">
      <ActionButton
        icon="i-ph:download-simple-bold"
        label="Download"
        onClick={handleDownload}
      />
      <ActionButton
        icon="i-ph:github-logo-bold"
        label="Link GitHub"
        onClick={handleGithubLink}
      />
      <ActionButton
        icon={isFullscreen ? "i-ph:corners-in-bold" : "i-ph:corners-out-bold"}
        label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        onClick={handleFullscreen}
      />
    </div>
  );
}
