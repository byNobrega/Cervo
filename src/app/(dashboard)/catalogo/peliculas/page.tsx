import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarcaAccordion } from '@/components/catalogo/MarcaAccordion'
import { TipoPeliculaCard } from '@/components/catalogo/TipoPeliculaCard'
export const dynamic = 'force-dynamic'

export default async function PeliculasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: maquina }, { data: tradicionais }, { data: modelos }, { data: perfil }] = await Promise.all([
    supabase.from('tipos_pelicula_maquina').select('*').order('nome'),
    supabase.from('tipos_pelicula_tradicional').select('*').order('nome'),
    supabase
      .from('modelos_celular')
      .select('*, marca:marcas_celular(nome)')
      .eq('ativo', true)
      .eq('tem_tela_curva', false)
      .order('ordem')
      .order('nome'),
    supabase.from('profiles').select('cargo').eq('id', user.id).single(),
  ])

  const podeGerenciar = ['gerente', 'dono'].includes(perfil?.cargo ?? '')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-gray-900">Películas</h2>
        <p className="text-gray-500 text-sm mt-0.5">Lista fixa de películas disponíveis</p>
      </div>

      {/* Máquina */}
      <section>
        <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-3">
          Máquina (TPU/Hidrogel) — sem modelo
        </h3>
        <div className="space-y-1.5">
          {(maquina ?? []).map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-lg p-2">
              <TipoPeliculaCard
                tabela="maquina"
                id={p.id}
                nome={p.nome}
                fotoUrl={p.foto_url}
                podeGerenciar={podeGerenciar}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Tradicionais */}
      <section>
        <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
          Tradicionais (Vidro 3D / Cerâmica) — por modelo
        </h3>
        <p className="text-[11px] text-orange-500 mb-3">
          ⚠ Modelos com tela curva estão bloqueados nesta categoria
        </p>
        <div className="space-y-4">
          {(tradicionais ?? []).map((tipo) => {
            const marcasUsadas = Array.from(new Set((modelos ?? []).map((m) => (m.marca as { nome: string })?.nome))).sort()
            return (
              <div key={tipo.id}>
                <div className="mb-2">
                  <TipoPeliculaCard
                    tabela="tradicional"
                    id={tipo.id}
                    nome={tipo.nome}
                    podeGerenciar={podeGerenciar}
                  />
                </div>
                <div className="space-y-1.5">
                  {marcasUsadas.map((marca) => {
                    const modelosMarca = (modelos ?? [])
                      .filter((m) => (m.marca as { nome: string })?.nome === marca)
                      .map((m) => ({ id: m.id, nome: m.nome }))
                    return (
                      <MarcaAccordion key={marca} marca={marca} modelos={modelosMarca} />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
