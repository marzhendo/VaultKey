import React from "react";
import { useToastStore, Toast } from "../../store/toastStore";
import { Check, X, AlertTriangle, Info } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const getToastIcon = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return <Check size={16} className="toast-icon-svg success" />;
      case "error":
        return <X size={16} className="toast-icon-svg error" />;
      case "warning":
        return <AlertTriangle size={16} className="toast-icon-svg warning" />;
      case "info":
        return <Info size={16} className="toast-icon-svg info" />;
    }
  };

  return (
    <div className="toast-container" id="toast-root">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.type}`}>
          <div className="toast-icon-wrapper">
            {getToastIcon(t.type)}
          </div>
          <span className="toast-message">{t.message}</span>
          <button 
            type="button" 
            className="toast-close-btn" 
            onClick={() => removeToast(t.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
