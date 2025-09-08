import React from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

const Modal = ({ isOpen, onClose, children, className }) => {
  console.log('[Modal] 🔍 Modal render:', { isOpen, onClose: !!onClose });
  
  if (!isOpen) {
    console.log('[Modal] ❌ Modal no está abierto, retornando null');
    return null;
  }

  console.log('[Modal] ✅ Modal está abierto, renderizando...');

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative bg-white rounded-lg border border-gray-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto",
        className
      )}>
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        
        {children}
      </div>
    </div>
  );

  // Usar portal para renderizar el modal en el body, escapando del contenedor padre
  return createPortal(modalContent, document.body);
}

const ModalHeader = ({ children, className }) => (
  <div className={cn("p-6 pb-2", className)}>
    {children}
  </div>
)

const ModalTitle = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold text-gray-900", className)}>
    {children}
  </h2>
)

const ModalContent = ({ children, className }) => (
  <div className={cn("px-6 py-2", className)}>
    {children}
  </div>
)

const ModalFooter = ({ children, className }) => (
  <div className={cn("flex justify-end gap-2 p-6 pt-4 border-t border-gray-200", className)}>
    {children}
  </div>
)

export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter }
