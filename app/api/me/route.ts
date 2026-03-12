/**
 * GET /api/me - Endpoint centralizado de dados do usuário autenticado
 *
 * Agrega dados de sessão (JWT) com dados de perfil (escalistas)
 * em uma única resposta padronizada.
 */

import { NextResponse } from 'next/server'
import { getJWTClaims, isAdmin } from '@/lib/auth/jwtHelper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { UserSessionInfo } from '@/types/user-session'

export async function GET() {
  try {
    const claims = await getJWTClaims()

    if (!claims) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar nome e grupo_id principal na tabela escalistas
    let userName: string | null = null
    let grupoId: string | null = null

    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // Server Component - ignore
              }
            }
          }
        }
      )

      const { data: escalista } = await supabase
        .from('escalistas')
        .select('nome, grupo_id')
        .eq('id', claims.sub)
        .single()

      userName = escalista?.nome || null
      grupoId = escalista?.grupo_id || null
    } catch (err) {
      console.error('[API /me] Erro ao buscar dados do escalista:', err)
    }

    // Fallback: usar email se não houver nome
    if (!userName) {
      userName = claims.email
    }

    const data: UserSessionInfo = {
      id: claims.sub,
      email: claims.email,
      userRole: claims.user_role || null,
      roles: claims.roles,
      permissions: claims.permissions,
      grupoIds: claims.grupo_ids,
      grupoId,
      userName,
      isAdmin: isAdmin(claims),
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[API /me] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
