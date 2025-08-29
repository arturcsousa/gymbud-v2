import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === 'destructive') {
        sonnerToast.error(title || description || 'Error');
      } else {
        sonnerToast.success(title || description || 'Success');
      }
    },
  };
};

// Export toast function directly for direct imports
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
};
