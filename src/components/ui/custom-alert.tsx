import React, { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning';

interface CustomAlertProps {
  type: AlertType;
  title: string;
  message: string | null;
  show: boolean;
  onDismiss?: () => void;
  duration?: number;
}

const alertConfig = {
  success: {
    variant: 'success',
    icon: CheckCircle2,
    className: 'bg-green-50 text-green-700 border-green-200',
    autoDismiss: true,
    duration: 5000
  },
  error: {
    variant: 'destructive',
    icon: Info,
    className: 'bg-red-50 text-red-700 border-red-200',
    autoDismiss: false
  },
  warning: {
    variant: 'warning',
    icon: AlertTriangle,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    autoDismiss: false
  }
};

export const CustomAlert: React.FC<CustomAlertProps> = ({ 
  type, 
  title, 
  message, 
  show, 
  onDismiss,
  duration
}) => {
  if (!show || !message) return null;

  const config = alertConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (config.autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration || config.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss, config.autoDismiss, duration]);

  return (
    <Alert 
      variant={config.variant} 
      className={`mb-4 ${config.className} relative`}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {!config.autoDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};