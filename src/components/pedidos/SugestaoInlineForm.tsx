'use client'

import { useState } from 'react'
import { usePedidoStore } from '@/store/pedidoStore'
import { type TipoSugestao, type SubcategoriaAcessorio } from '@/types'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { criarSugestaoInline } from '@/app/actions/sugestoes'
import { Loader2, X } from 'lucide-react'

interface Props {
  tipo: TipoSugestao
  onFechar: () => void
  // Subcategorias de acessório (para o funcionário classificar a sugestão)
  subcategorias?: SubcategoriaAcessorio[]
}

export function SugestaoInlineForm({ tipo, onFechar, subcategorias = [] }: Props) {
  const [nome, setNome] = useState('')
  const [marca, setMarca] = useState('')
  const [subcategoriaId, setSubcategoriaId] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [salvando, setSalvando] = useState(false)
  const { adicionarItem } = usePedidoStore()

  const label = tipo === 'acessorio' ? 'acessório' : tipo === 'material' ? 'material' : 'subcategoria de capa'

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)

    try {
      const sugestaoId = await criarSugestaoInline({
        tipo,
        nome,
        marca: marca || undefined,
        fotoUrl: fotoUrl || undefined,
        subcategoriaId: tipo === 'acessorio' && subcategoriaId ? subcategoriaId : undefined,
      })

      // Adiciona ao pedido imediatamente como item pendente
      adicionarItem({
        categoria: tipo === 'acessorio' ? 'acessorio' : tipo === 'material' ? 'material' : 'acessorio',
        nome,
        fotoUrl: fotoUrl || null,
        observacao: '',
        sugestaoId,
        isPendenteSugestao: true,
      })

      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-yellow-800">Sugerir novo {label}</p>
        <button onClick={onFechar} className="text-yellow-500 hover:text-yellow-700">
          <X size={15} />
        </button>
      </div>

      <PhotoUpload
        value={fotoUrl}
        onChange={setFotoUrl}
        pasta="sugestoes"
        label="Foto"
      />

      <div>
        <label className="block text-xs font-medium text-yellow-700 mb-1">Nome *</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={`Nome do ${label}`}
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
          </div>
          <div>
            <label className="block text-xs font-medium text-yellow-700 mb-1">Marca (opcional)</label>
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Marca"
              className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            />
          </div>
        </>
      )}

      <p className="text-[11px] text-yellow-600">
        O item entrará no pedido como pendente até ser aprovado pelo gerente.
      </p>

      <button
        onClick={salvar}
        disabled={!nome.trim() || salvando}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
      >
        {salvando && <Loader2 size={14} className="animate-spin" />}
        Sugerir e adicionar ao pedido
      </button>
    </div>
  )
}
