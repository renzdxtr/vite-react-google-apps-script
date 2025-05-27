import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DialogType = 'warning' | 'info' | 'success';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  details?: React.ReactNode;
}

const dialogConfig = {
  warning: {
    icon: AlertTriangle,
    className: 'text-yellow-600',
    confirmClassName: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: Info,
    className: 'text-blue-600',
    confirmClassName: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: CheckCircle2,
    className: 'text-green-600',
    confirmClassName: 'bg-green-600 hover:bg-green-700',
  },
};

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    type = 'warning',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
    details,
  }: ConfirmationDialogProps) {
    const config = dialogConfig[type];
    const Icon = config.icon;
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[280px] sm:w-[448px] p-4">
          <DialogHeader className="space-y-2.5">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
              <Icon className={cn('h-5 w-5', config.className)} />
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-normal">
              {description}
            </DialogDescription>
          </DialogHeader>
  
          {details && (
            <div className="mt-3 bg-muted/50 rounded-md p-3 text-sm leading-relaxed">
              {details}
            </div>
          )}
  
          <DialogFooter className="flex gap-2 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-11 sm:h-12 text-sm font-medium"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 h-11 sm:h-12 text-sm font-medium text-white',
                config.confirmClassName
              )}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }