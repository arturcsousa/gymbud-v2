import { toast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === 'destructive') {
        toast.error(title || description || 'Error');
      } else {
        toast.success(title || description || 'Success');
      }
    },
  };
};
