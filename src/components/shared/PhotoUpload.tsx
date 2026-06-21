'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface PhotoUploadProps {
  value: string
  onChange: (url: string) => void
  bucket?: string
  pasta?: string
  label?: string
  obrigatoria?: boolean
}

export function PhotoUpload({
  value,
  onChange,
  bucket = 'fotos-itens',
  pasta = 'uploads',
  label = 'Foto',
  obrigatoria = false,
}: PhotoUploadProps) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErro('Selecione uma imagem válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErro('Imagem muito grande (máx. 5MB)')
      return
    }

    setErro('')
    setCarregando(true)

    try {
      const ext = file.name.split('.').pop()
      const nome = `${pasta}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(nome, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(nome)
      onChange(data.publicUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[PhotoUpload] erro no upload:', err)
      setErro(`Erro ao enviar imagem: ${msg}`)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {obrigatoria && <span className="text-red-500 ml-1">*</span>}
      </label>

      {value ? (
        <div className="relative w-24 h-24">
          <Image
            src={value}
            alt="Foto do item"
            fill
            sizes="150px"
            className="object-cover rounded-xl border border-gray-100"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remover foto"
            title="Remover foto"
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={carregando}
          className={cn(
            'w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors',
            carregando && 'opacity-50 cursor-not-allowed'
          )}
        >
          {carregando ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Camera size={20} />
              <span className="text-[11px]">Adicionar</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Selecionar imagem"
        title="Selecionar imagem"
        className="hidden"
        onChange={handleFile}
      />

      {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
    </div>
  )
}
