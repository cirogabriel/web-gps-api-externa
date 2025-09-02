import React from "react"
import { cn } from "../../lib/utils"

const badgeVariants = (variant = "default") => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-gray-900 text-white hover:bg-gray-800",
    secondary: "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "text-gray-900 border-gray-300"
  }
  
  return cn(baseClasses, variants[variant])
}

const Badge = ({ className, variant, ...props }) => {
  return (
    <div className={cn(badgeVariants(variant), className)} {...props} />
  )
}

export { Badge }
