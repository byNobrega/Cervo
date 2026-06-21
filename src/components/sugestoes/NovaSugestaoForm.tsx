'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type TipoSugestao } from '@/types'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { criarSugestaoInline } from '@/app/actions/sugestoes'
import { Lightbulb, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPOS: { valor: TipoSugestao; label: string; ajuda: string }[] = [
  { valor: 'acessorio', label: 'Acessório', ajuda: 'Fones, cabos, carregadores, suportes...' },
  { valor: 'capa_subcategoria', label: 'Subcategoria de capa', ajuda: 'Um novo tipo/linha de capa' },
  { valor: 'material', label: 'Material de loja', ajuda: 'Sacolas, etiquetas, itens de uso interno...' },
  { valor: 'modelo', label: 'Aparelho (película)', ajuda: 'Modelo novo que falta nas películas (ex: aparelho recém-lançado)' },
]

type Opcao = { id: string; nome: string }

export function NovaSugestaoForm({
  subcategorias,
  marcas,
  // Quando fornecido, é chamado após enviar (em vez de router.refresh()).
  // Usado no fluxo de Novo Pedido para não recarregar e perder a lista em montagem.
  onEnviado,
  rotuloBotao = 'Sugerir novo item',
  tipoInicial = 'acessorio',
  // Quando true, esconde o seletor de tipo (form fixo num tipo só).
  tipoFixo = false,
  // Estilo do botão fechado: 'amarelo' (destaque) ou 'link' (discreto).
  variante = 'amarelo',
  // Classe de cor para a variante 'link' (ex: tema.link da categoria).
  classeLink = 'text-green-600 hover:text-green-700',
}: {
  subcategorias: Opcao[]
  marcas: Opcao[]
  onEnviado?: () => void
  // Rótulo do botão fechado (default: "Sugerir novo item").
  rotuloBotao?: string
  tipoInicial?: TipoSugestao
  tipoFixo?: boolean
  variante?: 'amarelo' | 'link'
  classeLink?: string
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState<TipoSugestao>(tipoInicial)
  const [nome, setNome] = useState('')
  const [marca, setMarca] = useState('')
  const [subcategoriaId, setSubcategoriaId] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [temTelaCurva, setTemTelaCurva] = useState(false)
  const [fotoUrl, setFotoUrl] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviada, setEnviada] = useState(false)

  const ehModelo = tipo === 'modelo'

  function resetar() {
    setTipo(tipoInicial)
    setNome('')
    setMarca('')
    setSubcategoriaId('')
    setMarcaId('')
    setTemTelaCurva(false)
    setFotoUrl('')
    setErro('')
  }

  function fechar() {
    setAberto(false)
    resetar()
  }

  async function salvar() {
    setErro('')
    if (!nome.trim()) {
      setErro(ehModelo ? 'Informe o nome do aparelho.' : 'Dê um nome ao item.')
      return
    }
    if (ehModelo && !marcaId) {
      setErro('Escolha a marca do aparelho.')
      return
    }
    // Foto obrigatória para itens (acessório/capa/material); opcional para modelo.
    if (!ehModelo && !fotoUrl) {
      setErro('A foto é obrigatória.')
      return
    }
    setSalvando(true)
    try {
      await criarSugestaoInline({
        tipo,
        nome: nome.trim(),
        marca: marca.trim() || undefined,
        fotoUrl: fotoUrl || undefined,
        subcategoriaId: tipo === 'acessorio' && subcategoriaId ? subcategoriaId : undefined,
        marcaId: ehModelo ? marcaId : undefined,
        temTelaCurva: ehModelo ? temTelaCurva : undefined,
      })
      fechar()
      if (onEnviado) {
        setEnviada(true)
        setTimeout(() => setEnviada(false), 4000)
        onEnviado()
      } else {
        router.refresh()
      }
    } catch {
      setErro('Não foi possível enviar a sugestão. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className={cn(
            'flex items-center gap-2 text-sm font-medium transition-colors',
            variante === 'amarelo'
              ? 'px-4 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 w-full justify-center sm:w-auto'
              : cn('mt-1', classeLink)
          )}
        >
          <Plus size={variante === 'amarelo' ? 16 : 15} />
          {rotuloBotao}
        </button>
        {enviada && (
          <p className="text-xs text-green-600 font-medium">
            ✓ Sugestão enviada! Ela vai para o gerente aprovar.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
          <Lightbulb size={15} /> Sugerir novo item
        </p>
        <button type="button" onClick={fechar} aria-label="Fechar" className="text-yellow-500 hover:text-yellow-700">
          <X size={15} />
        </button>
      </div>

      {!tipoFixo && (
        <div>
          <label className="block text-xs font-medium text-yellow-700 mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoSugestao)}
            aria-label="Tipo de sugestão"
            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
          >
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-yellow-600 mt-1">
            {TIPOS.find((t) => t.valor === tipo)?.ajuda}
          </p>
        </div>
      )}

      {/* ===== Campos do tipo MODELO (aparelho para películas) ===== */}
      {ehModelo ? (
        <>
          <div>
            <label className="block text-xs font-medium text-yellow-700 mb-1">Marca *</label>
            <select
              value={marcaId}
              onChange={(e) => setMarcaId(e.target.value)}
              aria-label="Marca do aparelho"
              className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="">Escolha a marca</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-yellow-700 mb-1">Modelo do aparelho *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Galaxy A26, iPhone 17..."
              aria-label="Modelo do aparelho"
              className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-yellow-700 cursor-pointer">
            <input
              type="checkbox"
              checked={temTelaCurva}
              onChange={(e) => setTemTelaCurva(e.target.checked)}
              className="rounded border-yellow-300 text-yellow-500 focus:ring-yellow-400"
            />
            Tela curva (bloqueia películas tradicionais)
          </label>
          <PhotoUpload
            value={fotoUrl}
            onChange={setFotoUrl}
            pasta="sugestoes"
            label="Foto (opcional)"
          />
        </>
      ) : (
        /* ===== Campos dos demais tipos ===== */
        <>
          <PhotoUpload
            value={fotoUrl}
            onChange={setFotoUrl}
            pasta="sugestoes"
            label="Foto (da câmera ou da galeria)"
            obrigatoria
          />

          <div>
            <label className="block text-xs font-medium text-yellow-700 mb-1">Nome *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do item"
              aria-label="Nome do item"
              className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            />
          </div>

          {tipo === 'acessorio' && (
            <>
              <div>
                <label className="block text-xs font-medium text-yellow-700 mb-1">Subcategoria</label>
                <select
                  value={subcategoriaId}
                  onChange={(e) => setSubcategoriaId(e.target.value)}
                  aria-label="Subcategoria do acessório"
                  className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                >
                  <option value="">Sem subcategoria definida</option>
                  {subcategorias.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                <p className="text-[11px] text-yellow-600 mt-1">
                  Ex: Fones de Fio, Fones Bluetooth, Cabos...
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-yellow-700 mb-1">Marca (opcional)</label>
                <input
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Marca"
                  aria-label="Marca"
                  className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                />
              </div>
            </>
          )}
        </>
      )}

      {erro && <p className="text-red-500 text-xs">{erro}</p>}

      <p className="text-[11px] text-yellow-600">
        A sugestão ficará <strong>pendente</strong> até o gerente aprovar.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
        >
          {salvando && <Loader2 size={14} className="animate-spin" />}
          Enviar sugestão
        </button>
        <button
          type="button"
          onClick={fechar}
          className="px-4 py-2 bg-white text-yellow-700 border border-yellow-200 rounded-lg text-sm hover:bg-yellow-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
