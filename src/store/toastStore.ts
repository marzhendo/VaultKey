import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 3000;
    
    set((state) => ({
      toasts: [{ ...toast, id, duration }, ...state.toasts],
    }));

    // Auto dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenience helpers
export const toast = {
  success: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: "success", message, duration });
  },
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: "error", message, duration });
  },
  warning: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: "warning", message, duration });
  },
  info: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: "info", message, duration });
  },
};
