import { XMarkIcon } from '@heroicons/react/24/outline';

interface AlertProps {
  children: React.ReactNode;
  type: 'error' | 'warning' | 'info';
  onClose?: () => void;
}

export function Alert({ children, type, onClose }: AlertProps) {
  const colors = {
    error: 'bg-red-100 text-red-900 border-red-200',
    warning: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    info: 'bg-blue-100 text-blue-900 border-blue-200'
  };

  return (
    <div className={`rounded-md p-4 border ${colors[type]} relative animate-fadeIn`} role="alert">
      <div className="flex">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
