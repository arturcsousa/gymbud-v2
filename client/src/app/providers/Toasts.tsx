import { Toaster } from "sonner";

export default function Toasts() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-center"
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "rounded-2xl shadow-lg",
          title: "font-medium",
          actionButton: "rounded-xl",
        },
      }}
    />
  );
}
