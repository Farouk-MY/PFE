import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return ''

  const dateObject = typeof date === 'string' ? new Date(date) : date

  // Check if date is valid
  if (isNaN(dateObject.getTime())) return ''

  // Format as "Month DD, YYYY" (e.g., "March 15, 2024")
  return dateObject.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}