import React, { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      timer = window.setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 150);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isOpen, isRendered]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  if (!isRendered) return null;

  return (
    <div 
      className={`modal-overlay ${isClosing ? "overlay-out" : "overlay-in"}`} 
      onClick={handleClose}
    >
      <div 
        className={`modal-content ${isClosing ? "modal-out" : "modal-in"}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
