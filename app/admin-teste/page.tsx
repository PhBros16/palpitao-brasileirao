// Conferência visual do Admin. Rota: /admin-teste.
// isAdmin=true para ver a tela completa. Trocar para false para ver a tela de acesso restrito.

import { AdminScreen } from '@/components/admin'

export default function AdminTestePage() {
  return <AdminScreen isAdmin={true} />
}
