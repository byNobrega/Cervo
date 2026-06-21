# Cervo

Sistema web de gestão de pedidos para lojas de acessórios de celular.

O Cervo organiza o fluxo de compra de mercadoria de uma loja: o funcionário monta a lista do que está faltando, o gerente acompanha o que precisa ser comprado (marcando cada item como comprado ou indisponível) e o pedido é arquivado no histórico. O sistema conta com catálogo próprio, suporte a múltiplas unidades e envio de listas por WhatsApp.

Versão atual: **1.0**

## Funcionalidades

- **Autenticação e perfis de acesso** — Dono, Gerente e Funcionário, com cadastro sujeito à aprovação do Dono.
- **Múltiplas unidades** — cada usuário e pedido é vinculado a uma loja, com identificação visual da unidade.
- **Pedidos** — criação assistida por categoria, marcação de status (comprado / indisponível), finalização, impressão e histórico com filtros e paginação.
- **Catálogo centralizado** — Acessórios, Capas, Películas e Material de Loja, com cadastro, edição e exclusão restritos a Gerente e Dono. Os modelos de aparelho constituem uma fonte única de dados, refletida automaticamente em capas e películas.
- **Sugestões** — funcionários podem sugerir novos itens e aparelhos; após aprovação do gerente, o item é incorporado ao catálogo.
- **Perfil do usuário** — edição de foto, nome e WhatsApp, redefinição de senha por e-mail e solicitação de mudança de cargo ou unidade mediante aprovação.
- **Análises** — indicadores, gráficos e rankings dos pedidos por período.
- **Notificações** — internas e, opcionalmente, espelhadas no WhatsApp via integração Z-API.

## Tecnologias

- Next.js 14 (App Router) e TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage e Row Level Security)
- Zustand, React Hook Form, Zod, Recharts e lucide-react

## Execução local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# preencha .env.local com as chaves do seu projeto Supabase

# 3. Iniciar o ambiente de desenvolvimento
npm run dev
```

A aplicação ficará disponível em http://localhost:3000.

### Variáveis de ambiente

Consulte o arquivo `.env.example`. As principais são:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço, restrita ao servidor — não deve ser versionada |
| `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN` | Integração com WhatsApp (opcional) |

O arquivo `.env.local` está incluído no `.gitignore` e não deve ser enviado ao repositório.

### Banco de dados

As migrações encontram-se em `supabase/migrations/` e devem ser aplicadas no SQL Editor do Supabase, em ordem sequencial (`001` a `006`). É necessário criar também o bucket público `fotos-itens` no Storage.

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/         login e cadastro
│   └── (dashboard)/    painel, pedidos, catálogo, análises, perfil
├── components/         componentes de interface por domínio
├── lib/                clientes Supabase, validações e integrações
├── hooks/              hooks de autenticação e notificações
└── store/              estado do pedido em criação
supabase/migrations/    scripts de schema, RLS e funcionalidades
```

## Roadmap

- Integração ativa com o WhatsApp (Z-API) utilizando número real.
- Ativação do resumo mensal e dos indicadores financeiros.
- Disponibilização como PWA (instalável em dispositivos móveis).

---

© 2026 @byNobrega. Todos os direitos reservados.
