"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated } = useUserStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
    } else {
      // Redirect to dashboard by default
      router.push('/profile/dashboard')
    }
  }, [isAuthenticated, router])

  return null // This page acts as a redirect
}