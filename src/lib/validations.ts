import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const cadastroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cargo: z.enum(['funcionario', 'gerente'], {
    message: 'Selecione um cargo',
  }),
  whatsapp: z
    .string()
    .min(10, 'WhatsApp inválido')
    .regex(/^\d+$/, 'Apenas números'),
  unidade_id: z.string().uuid('Selecione uma unidade'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha'],
})

export const modeloCelularSchema = z.object({
  marca_id: z.string().uuid('Selecione uma marca'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tem_tela_curva: z.boolean(),
})

export const acessorioSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  marca: z.string().optional(),
  subcategoria_id: z.string().uuid().optional(),
  foto_url: z.string().min(1, 'Foto obrigatória'),
})

export const materialSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  foto_url: z.string().optional(),
})

export const sugestaoItemSchema = z.object({
  tipo: z.enum(['acessorio', 'capa_subcategoria', 'material']),
  nome: z.string().min(2, 'Nome obrigatório'),
  marca: z.string().optional(),
  subcategoria_id: z.string().uuid().optional(),
  foto_url: z.string().optional(),
})

export const sugestaoFormSchema = z.object({
  itens: z.array(sugestaoItemSchema).min(1, 'Adicione pelo menos um item'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type CadastroFormData = z.infer<typeof cadastroSchema>
export type ModeloCelularFormData = z.infer<typeof modeloCelularSchema>
export type AcessorioFormData = z.infer<typeof acessorioSchema>
export type MaterialFormData = z.infer<typeof materialSchema>
export type SugestaoFormData = z.infer<typeof sugestaoFormSchema>
