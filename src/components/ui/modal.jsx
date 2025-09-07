import React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

const Modal = ({ isOpen, onClose, children, className }) => {
  console.log('[Modal] 🔍 Modal render:', { isOpen });
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative bg-white rounded-lg border border-gray-200 shadow-2xl max-w-lg w-full mx-4",
        className
      )}>
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        
        {children}
      </div>
    </div>
  )
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
