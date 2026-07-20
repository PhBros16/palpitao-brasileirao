'use client'

// /admin-teste — versão de desenvolvimento (isAdmin hardcoded).
// Envolvida no AppLayout pra ganhar Header + Nav + Player.

import { AdminScreen } from '@/components/admin/AdminScreen'
import { AppLayout } from '@/components/home/AppLayout'

export default function AdminTestePage() {
  return (
    <AppLayout>
      <AdminScreen isAdmin={true} />
    </AppLayout>
  )
}
