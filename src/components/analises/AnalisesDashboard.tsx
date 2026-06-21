'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { type MetricasAnalise } from '@/lib/analises'
import { type CategoriaPedido } from '@/lib/constants'
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Wallet,
  TrendingUp,
  PackageSearch,
  Lock,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Cores (hex) por categoria, alinhadas ao tema da UI.
const COR_CATEGORIA: Record<CategoriaPedido, string> = {
  acessorios: '#16a34a', // green-600
  capas: '#0ea5e9', // sky-500
  peliculas: '#f97316', // orange-500
  material: '#9333ea', // purple-600
}

const COR_STATUS = {
  verde: 'text-green-600',
  amarelo: 'text-amber-500',
  vermelho: 'text-red-500',
} as const

export function AnalisesDashboard({ metricas: m }: { metricas: MetricasAnalise }) {
  const semDados = m.totalPedidos === 0

  if (semDados) {
    return (
      <div className="text-center py-16 text-gray-400">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhum pedido no período selecionado</p>
        <p className="text-xs mt-1">Tente um período maior.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 - Pedidos */}
        <Card icone={<ClipboardList className="text-blue-500" size={18} />} titulo="Pedidos">
          <p className="text-2xl font-bold text-gray-900">{m.totalPedidos}</p>
          <p className="text-xs text-gray-500 mt-1">
            Concluídos: <strong className="text-green-600">{m.concluidos}</strong> ({m.pctConcluidos}%)
          </p>
          <p className="text-xs text-gray-500">
            Abertos: <strong className="text-orange-500">{m.abertos}</strong> ({m.pctAbertos}%)
          </p>
        </Card>

        {/* Card 2 - Taxa de conclusão */}
        <Card icone={<CheckCircle2 className="text-green-500" size={18} />} titulo="Taxa de conclusão">
          <p className="text-2xl font-bold text-gray-900">{m.taxaConclusao}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {m.concluidos} de {m.totalPedidos} pedidos
          </p>
          <p className={cn('text-xs font-medium mt-0.5', COR_STATUS[m.statusTaxa.cor])}>
            {m.statusTaxa.label}
          </p>
        </Card>

        {/* Card 3 - Itens não tem */}
        <Card icone={<XCircle className="text-red-400" size={18} />} titulo="Itens não tem">
          <p className="text-2xl font-bold text-gray-900">{m.pctPedidosComNaoTem}%</p>
          <p className="text-xs text-gray-500 mt-1">
            dos pedidos têm itens não encontrados
          </p>
          <p className="text-xs text-gray-500">
            ~{m.mediaNaoTemPorPedido} por pedido ({m.itensNaoTem} no total)
          </p>
        </Card>

        {/* Card 4 - Financeiro (EM BREVE) */}
        <CardBloqueado icone={<Wallet className="text-gray-400" size={18} />} titulo="Total investido">
          <div className="space-y-1 text-xs text-gray-400">
            <p>Acessórios: R$ —</p>
            <p>Capas: R$ —</p>
            <p>Películas: R$ —</p>
          </div>
        </CardBloqueado>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Pizza - itens por categoria */}
        <Painel titulo="Itens por categoria">
          {m.porCategoria.length === 0 ? (
            <Vazio />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={m.porCategoria}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={(e: { nome?: string; percent?: number }) =>
                      `${e.nome ?? ''} ${Math.round((e.percent ?? 0) * 100)}%`
                    }
                    labelLine={false}
                  >
                    {m.porCategoria.map((c) => (
                      <Cell key={c.chave} fill={COR_CATEGORIA[c.chave]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Painel>

        {/* Barras - pedidos ao longo do tempo */}
        <Painel titulo="Pedidos ao longo do tempo">
          {m.porDia.length === 0 ? (
            <Vazio />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.porDia} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="pedidos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Painel>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Painel titulo="Itens mais pedidos" icone={<TrendingUp size={14} className="text-blue-500" />}>
          <Ranking itens={m.itensMaisPedidos} corBarra="bg-blue-400" />
        </Painel>
        <Painel titulo="Itens que mais faltaram (não tem)" icone={<PackageSearch size={14} className="text-red-400" />}>
          <Ranking itens={m.itensMaisNaoTem} corBarra="bg-red-400" vazioMsg="Nenhum item marcado como 'não tem'." />
        </Painel>
      </div>

      {/* Resumo do mês (EM BREVE) */}
      <ResumoDoMes />
    </div>
  )
}

// Painel maior com insights do mês — ainda em desenvolvimento (interditado).
function ResumoDoMes() {
  return (
    <BlocoInterditado>
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <Sparkles size={15} className="text-amber-500" />
          Resumo do Mês
        </h3>
        <div className="space-y-2.5 text-sm text-gray-500">
          <p className="flex items-start gap-2">
            <TrendingUp size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
            Você fez <strong>X pedidos</strong> este mês, um aumento de <strong>Y%</strong> em relação ao mês passado.
          </p>
          <p className="flex items-start gap-2">
            <PackageSearch size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
            O item que mais faltou foi <strong>&quot;…&quot;</strong> — considere reforçar o estoque.
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
            Sua taxa de conclusão média foi de <strong>Z%</strong>.
          </p>
          <p className="flex items-start gap-2">
            <Sparkles size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
            Categoria em destaque: <strong>…</strong>.
          </p>
        </div>
      </div>
    </BlocoInterditado>
  )
}

function Card({
  icone,
  titulo,
  children,
}: {
  icone: React.ReactNode
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-gray-50">{icone}</div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{titulo}</span>
      </div>
      {children}
    </div>
  )
}

// Wrapper que sobrepõe uma "fita de interditado" (listras amarelas/pretas)
// com o selo EM BREVE sobre qualquer conteúdo ainda não disponível.
function BlocoInterditado({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="opacity-50 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
        <div
          className="w-[160%] -rotate-12 py-1.5 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest text-gray-900 shadow-md"
          style={{
            background:
              'repeating-linear-gradient(45deg, #facc15 0, #facc15 12px, #1f2937 12px, #1f2937 24px)',
          }}
        >
          <span className="bg-yellow-300 px-2 py-0.5 rounded-sm flex items-center gap-1">
            <Lock size={11} />
            EM BREVE
          </span>
        </div>
      </div>
    </div>
  )
}

// Card de métrica com a fita "EM BREVE" — financeiro ainda não disponível.
function CardBloqueado({
  icone,
  titulo,
  children,
}: {
  icone: React.ReactNode
  titulo: string
  children: React.ReactNode
}) {
  return (
    <BlocoInterditado>
      <div className="bg-white border border-gray-100 rounded-xl p-4 h-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-gray-50">{icone}</div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{titulo}</span>
        </div>
        {children}
      </div>
    </BlocoInterditado>
  )
}

function Painel({
  titulo,
  icone,
  children,
}: {
  titulo: string
  icone?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
        {icone}
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function Ranking({
  itens,
  corBarra,
  vazioMsg = 'Sem dados no período.',
}: {
  itens: { nome: string; qtd: number }[]
  corBarra: string
  vazioMsg?: string
}) {
  if (itens.length === 0) return <p className="text-xs text-gray-300 py-4 text-center">{vazioMsg}</p>
  const max = Math.max(...itens.map((i) => i.qtd))
  return (
    <div className="space-y-2">
      {itens.map((i, idx) => (
        <div key={`${i.nome}-${idx}`} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-4 flex-shrink-0">{idx + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-gray-700 truncate">{i.nome}</span>
              <span className="text-xs font-medium text-gray-500 flex-shrink-0 ml-2">{i.qtd}x</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={cn('h-full rounded-full', corBarra)} style={{ width: `${(i.qtd / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Vazio() {
  return (
    <div className="h-64 flex items-center justify-center text-xs text-gray-300">
      Sem dados no período
    </div>
  )
}
