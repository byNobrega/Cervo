import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const ROTAS_PUBLICAS = ['/login', '/cadastro']

// Rotas restritas por cargo
const ROTAS_DONO = ['/usuarios']
// /sugestoes é acessível a todos (funcionário vê as suas; gerente/dono revisam).
const ROTAS_GERENTE_DONO = ['/alertas', '/unidades', '/analises', '/modelos']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas de API e assets passam direto
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r))

  // Não autenticado: só pode acessar rotas públicas
  if (!user) {
    if (isPublica) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Autenticado tentando acessar login/cadastro → redireciona para painel
  if (isPublica) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  // Ler cargo e status da tabela profiles (fonte da verdade).
  // app_metadata não é populado pelo fluxo de cadastro, então consultamos o perfil.
  const { data: perfil } = await supabase
    .from('profiles')
    .select('cargo, status')
    .eq('id', user.id)
    .single()

  const cargo: string = perfil?.cargo ?? ''
  const status: string = perfil?.status ?? 'pendente'

  // Usuário pendente ou rejeitado → página de aguardo
  if (status !== 'aprovado') {
    if (!pathname.startsWith('/aguardando')) {
      return NextResponse.redirect(new URL('/aguardando', request.url))
    }
    return response
  }

  // Restrição de rotas por cargo
  const rotasDono = ROTAS_DONO.some((r) => pathname.startsWith(r))
  if (rotasDono && cargo !== 'dono') {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  const rotasGerenteDono = ROTAS_GERENTE_DONO.some((r) => pathname.startsWith(r))
  if (rotasGerenteDono && !['gerente', 'dono'].includes(cargo)) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  // Raiz "/" → redireciona para /painel
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
