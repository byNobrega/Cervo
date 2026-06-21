'use client'

import { useState, useTransition } from 'react'
import { criarUnidade } from '@/app/actions/unidades'
import { Plus, Loader2 } from 'lucide-react'

export function GerenciarUnidades() {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [isPending, startTransition] = useTransition()

  function salvar() {
    if (!nome.trim()) return
    startTransition(async () => {
      await criarUnidade(nome.trim(), endereco.trim())
      setNome('')
      setEndereco('')
      setAberto(false)
    })
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
      >
        <Plus size={16} />
        Nova unidade
      </button>
    )
  }

  return (
    <div className="bg-white border border-blue-100 rounded-xl p-4 mt-4 space-y-3">
      <h4 className="font-medium text-sm text-gray-900">Nova unidade</h4>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nome da loja</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Top Shopping"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Endereço (opcional)</label>
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Ex: Av. Principal, 123"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={isPending || !nome.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Criar
        </button>
        <button
          type="button"
          onClick={() => { setAberto(false); setNome(''); setEndereco('') }}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
