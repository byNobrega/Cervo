# Cervo — guia para o Claude Code

Sistema de listas de compra das lojas de acessórios de celular (ver README.md).
Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + Vercel.

## Antes de começar

- Leia o diário mais recente em `docs/sessoes/` — é a memória das sessões anteriores
  (o que foi feito, decisões e pendências).
- O dono do projeto (Gabriel, cargo `dono` = administrador no app) não é
  desenvolvedor: explique em português simples e confirme antes de ações que vão
  para produção.

## Fluxo de deploy

- Push na branch `main` = deploy automático na Vercel (produção). **Sempre confirmar
  com o Gabriel antes de dar push.**
- Migrations (`supabase/migrations/NNN_*.sql`) **não rodam sozinhas**: o Gabriel cola
  no Supabase > SQL Editor > Run. Toda migration nova deve ser idempotente
  (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`...) e o código deve continuar funcionando
  se ela ainda não tiver sido rodada. Avise qual arquivo rodar.
- Sem `.env.local` não dá para abrir o app. Validar com:
  `npx tsc --noEmit`, `npx next lint`, e `npx next build` (com env placeholder:
  `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co`, anon/service = `placeholder`).

## Regras de negócio e armadilhas

- Cargos: `dono` (admin, vê tudo), `gerente`, `funcionario`.
- **Lojas**: `profiles.unidade_id` = loja principal; `gerente_unidades` = lojas extras
  de QUALQUER cargo (apesar do nome). A função SQL `minhas_unidades()` e os helpers
  `src/lib/unidades.ts` / `src/lib/unidadesAcesso.ts` aplicam a mesma regra — manter
  os três em sincronia.
- **RLS de `profiles`**: funcionário só lê o próprio perfil. Para mostrar colegas
  (nome/foto/cargo) use o admin client no servidor e devolva só campos seguros
  (ver `src/lib/criadores.ts`, `src/app/actions/perfilPublico.ts`). E-mail/WhatsApp
  só para o dono.
- **RLS de `unidades` é aberto** (o cadastro lista as lojas). O filtro de quem vê qual
  unidade é feito nas páginas (`unidadesVisiveis`).
- Server actions que usam `createAdminClient()` passam por cima do RLS: **sempre**
  checar o cargo de quem chama (ex.: `exigirDono()` em `actions/usuarios.ts`,
  checagem de gerente/dono em `actions/sugestoes.ts`).
- Rascunho do Novo Pedido fica no `localStorage` do aparelho (`src/lib/rascunhoPedido.ts`).
- Fotos de produto: usar `FotoAmpliavel`; fotos de pessoa: `Avatar`
  (`src/components/shared/`).
