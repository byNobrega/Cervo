# 🚀 Guia Completo: Configurar o Supabase para o loja-alce

Este guia leva você do zero até o app rodando localmente. Siga **na ordem**, sem pular etapas. Cada passo diz exatamente onde clicar.

> ⏱️ Tempo estimado: 15 a 25 minutos.

---

## 📋 Índice

1. [Criar conta no Supabase](#1-criar-conta-no-supabase)
2. [Criar um novo projeto](#2-criar-um-novo-projeto)
3. [Encontrar as credenciais (URL e API Keys)](#3-encontrar-as-credenciais)
4. [Criar o arquivo `.env.local`](#4-criar-o-arquivo-envlocal)
5. [Rodar as migrations (criar as tabelas)](#5-rodar-as-migrations)
6. [Criar o bucket de fotos (Storage)](#6-criar-o-bucket-de-fotos)
7. [Criar o usuário admin (Dono)](#7-criar-o-usuário-admin-dono)
8. [Testar se a conexão funcionou](#8-testar-a-conexão)
9. [Rodar o projeto localmente](#9-rodar-o-projeto-localmente)
10. [Problemas comuns (troubleshooting)](#10-problemas-comuns)

---

## 1. Criar conta no Supabase

1. Abra o navegador e acesse: **https://supabase.com**
2. No canto superior direito, clique no botão verde **`Start your project`**.
3. Você será levado à tela de login. A forma mais rápida é entrar com o **GitHub**:
   - Clique em **`Continue with GitHub`**.
   - Se não tiver conta no GitHub, clique em `Sign up` no GitHub primeiro (leva 2 min), ou use a opção de email do Supabase.
4. Autorize o Supabase a acessar seu GitHub (botão **`Authorize supabase`**).
5. Pronto — você cairá no **Dashboard** do Supabase.

> 💡 É 100% gratuito para começar. O plano free é mais que suficiente para este projeto.

---

## 2. Criar um novo projeto

No Dashboard:

1. Clique no botão verde **`New project`** (geralmente no topo, ou dentro de uma organização).
2. Se for a primeira vez, ele pede para criar uma **Organização**:
   - **Name**: pode ser seu nome ou "Loja Alce". 
   - **Type**: escolha `Personal`.
   - Clique em **`Create organization`**.
3. Agora preencha os dados do projeto:

   | Campo | O que colocar |
   |---|---|
   | **Name** | `loja-alce` |
   | **Database Password** | Crie uma senha **forte** e **GUARDE EM LUGAR SEGURO** (anote no bloco de notas). Você vai precisar dela. Clique em `Generate a password` se quiser uma automática. |
   | **Region** | Escolha **`South America (São Paulo)`** — é a mais próxima do Brasil, deixa o app mais rápido. |
   | **Pricing Plan** | Deixe em **`Free`**. |

4. Clique em **`Create new project`**.
5. **Aguarde 1 a 2 minutos** enquanto o Supabase cria o banco de dados (aparece "Setting up project..."). Não feche a aba.

> ⚠️ **Anote a senha do banco!** Se perder, terá que resetar depois. Ela NÃO é a mesma coisa que a API Key.

---

## 3. Encontrar as credenciais

O app precisa de **3 valores** do Supabase. Veja onde achar cada um:

1. No menu lateral esquerdo, clique no ícone de **engrenagem ⚙️ `Project Settings`** (fica embaixo, no final do menu).
2. Dentro de Settings, clique em **`API`** (ou `Data API` dependendo da versão).
3. Você verá uma tela com:

   **a) Project URL** (a primeira credencial)
   - Está na seção **`Project URL`**.
   - Exemplo: `https://abcdefghijklmno.supabase.co`
   - Esse é o seu **`NEXT_PUBLIC_SUPABASE_URL`**.

   **b) API Keys** (as outras duas)
   - Mais abaixo, na seção **`Project API keys`**, há duas chaves:
   
   | Chave no Supabase | Vai virar no `.env.local` | Cuidado |
   |---|---|---|
   | **`anon` / `public`** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pode ficar exposta no front-end. OK. |
   | **`service_role` / `secret`** | `SUPABASE_SERVICE_ROLE_KEY` | 🔴 **SECRETA!** Nunca exponha publicamente. |

   - Clique no ícone de 👁️ ou **`Reveal`** ao lado de `service_role` para ver o valor.
   - Use o botão de **copiar 📋** ao lado de cada uma — são strings bem longas (começam com `eyJ...`).

> 🔐 **Importante**: a `service_role` key tem poder TOTAL sobre seu banco (ignora as regras de segurança). Nunca poste ela em prints, GitHub público ou mande para ninguém.

> 📝 Em versões mais novas do Supabase as chaves podem aparecer como `Publishable key` (= anon) e `Secret key` (= service_role). É a mesma coisa.

---

## 4. Criar o arquivo `.env.local`

O projeto já tem um arquivo `.env.local` **vazio** na raiz. Você só precisa preenchê-lo.

1. Abra a pasta do projeto no seu editor (VS Code):
   ```
   E:\backupPC\NobregaDev\PROJETO 1\loja-alce
   ```
2. Na raiz, abra (ou crie, se não existir) o arquivo chamado **`.env.local`**.
3. Cole o conteúdo abaixo e **substitua** pelos valores que você copiou no passo 3:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO_AQUI.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_a_anon_key_aqui
   SUPABASE_SERVICE_ROLE_KEY=cole_a_service_role_key_aqui

   # WhatsApp via Z-API — deixe vazio por enquanto (opcional, configura depois)
   ZAPI_INSTANCE_ID=
   ZAPI_TOKEN=
   ZAPI_CLIENT_TOKEN=
   ```

4. **Salve o arquivo** (Ctrl+S).

> ⚠️ Regras importantes:
> - **NÃO** use aspas em volta dos valores.
> - **NÃO** deixe espaços antes/depois do `=`.
> - O nome do arquivo é exatamente `.env.local` (com o ponto na frente). Não é `.env.local.txt`.
> - Esse arquivo já está no `.gitignore`, então nunca vai parar no Git. 👍

✅ **Como deve ficar (exemplo preenchido):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xl...
```

---

## 5. Rodar as migrations

"Migrations" são os scripts SQL que criam as tabelas, regras de segurança e dados iniciais. O projeto tem **3 arquivos** na pasta `supabase/migrations/`:

| Arquivo | O que faz |
|---|---|
| `001_schema.sql` | Cria todas as tabelas, triggers e funções |
| `002_rls.sql` | Cria as regras de segurança (quem pode ver/editar o quê) |
| `003_seed.sql` | Insere os dados iniciais (marcas, subcategorias, materiais) |

Vamos rodá-los pelo **SQL Editor** do Supabase (jeito mais fácil, sem instalar nada).

### Passo a passo:

1. No menu lateral esquerdo do Supabase, clique em **`SQL Editor`** (ícone de `</>`).
2. Clique em **`+ New query`** (botão no canto, ou "New snippet").
3. Agora rode os 3 arquivos **NA ORDEM CERTA** (001 → 002 → 003). Para cada um:

   **Arquivo 1 — `001_schema.sql`:**
   - No VS Code, abra `supabase/migrations/001_schema.sql`.
   - Selecione **TODO** o conteúdo (Ctrl+A) e copie (Ctrl+C).
   - Volte ao SQL Editor do Supabase, cole (Ctrl+V) na caixa de texto.
   - Clique no botão **`Run`** (ou aperte Ctrl+Enter).
   - Deve aparecer **`Success. No rows returned`** na parte de baixo. ✅

   **Arquivo 2 — `002_rls.sql`:**
   - Apague o conteúdo anterior do editor (Ctrl+A, Delete).
   - Cole o conteúdo de `002_rls.sql`.
   - Clique em **`Run`**. Deve dar `Success`. ✅

   **Arquivo 3 — `003_seed.sql`:**
   - Apague e cole o conteúdo de `003_seed.sql`.
   - Clique em **`Run`**. Deve dar `Success`. ✅

4. **Conferir se deu certo**: no menu lateral, clique em **`Table Editor`**. Você deve ver várias tabelas: `profiles`, `pedidos`, `pedido_itens`, `acessorios`, `capas`, `marcas_celular`, `modelos_celular`, `notificacoes`, `alertas`, `sugestoes`, etc.

> ⚠️ **A ordem importa!** O `002` depende do `001`, e o `003` depende dos dois. Se rodar fora de ordem, dá erro de "tabela não existe". Se errar, rode os 3 de novo na ordem.

---

## 6. Criar o bucket de fotos

O app salva as fotos dos produtos no **Storage** do Supabase, num "bucket" (pasta) chamado **`fotos-itens`**. Precisamos criá-lo.

1. No menu lateral, clique em **`Storage`**.
2. Clique em **`New bucket`** (ou `Create bucket`).
3. Preencha:
   - **Name**: digite exatamente **`fotos-itens`** (com hífen, tudo minúsculo).
   - **Public bucket**: **LIGUE** essa opção (toggle/switch para ON). As fotos precisam ser públicas para aparecer no app.
4. Clique em **`Create bucket`** (ou `Save`).

✅ Pronto, o bucket aparecerá na lista do Storage.

> 💡 Se o nome estiver diferente de `fotos-itens`, o upload de fotos vai falhar. Esse nome está fixo no código (`PhotoUpload.tsx`).

---

## 7. Criar o usuário admin (Dono)

O sistema precisa de um usuário **Dono** para aprovar os outros cadastros. Vamos criar o admin manualmente.

### 7.1 — Criar o usuário no Authentication

1. No menu lateral, clique em **`Authentication`**.
2. Clique na aba **`Users`** (no topo).
3. Clique em **`Add user`** → **`Create new user`**.
4. Preencha:
   - **Email**: `admin@lojaalce.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ **LIGUE** (importante — senão o login não funciona sem confirmar email).
5. Clique em **`Create user`**.

### 7.2 — Promover o usuário a Dono

O cadastro acima cria um `profile` automaticamente (pelo trigger), mas com cargo de funcionário e status pendente. Precisamos promovê-lo:

1. Volte ao **`SQL Editor`** → `+ New query`.
2. Cole e rode este comando:

   ```sql
   UPDATE profiles
   SET cargo = 'dono', status = 'aprovado', nome = 'Administrador'
   WHERE email = 'admin@lojaalce.com';
   ```
3. Clique em **`Run`**. Deve aparecer `Success. 1 row affected` ou similar. ✅

> 💡 Se aparecer `0 rows affected`, o profile ainda não foi criado pelo trigger. Espere alguns segundos, ou confira em `Table Editor → profiles` se o admin está lá. Se não estiver, o trigger `handle_new_user` pode não ter rodado — confira se o `001_schema.sql` rodou sem erro.

---

## 8. Testar a conexão

Antes de rodar o app, vamos garantir que o terminal está pronto.

1. Abra o terminal do VS Code: menu **`Terminal`** → **`New Terminal`** (ou Ctrl+`).
2. Confirme que está na pasta certa. O terminal deve mostrar algo como:
   ```
   PS E:\backupPC\NobregaDev\PROJETO 1\loja-alce>
   ```
   Se não estiver, navegue até lá:
   ```powershell
   cd "E:\backupPC\NobregaDev\PROJETO 1\loja-alce"
   ```
3. Instale as dependências (caso ainda não tenha feito):
   ```powershell
   npm install
   ```
   Aguarde terminar (pode levar 1-3 min na primeira vez).

---

## 9. Rodar o projeto localmente

1. No terminal, rode:
   ```powershell
   npm run dev
   ```
2. Aguarde aparecer algo como:
   ```
   ▲ Next.js 14.2.x
   - Local:   http://localhost:3000
   ✓ Ready in 2.3s
   ```
3. Abra o navegador e acesse: **http://localhost:3000**
4. Você será redirecionado para a tela de **login**.
5. **Faça login com o admin:**
   - Email: `admin@lojaalce.com`
   - Senha: `admin123`
6. Se cair no **Painel** (dashboard) com cards de Pedidos, Catálogo, etc. → **🎉 ESTÁ FUNCIONANDO!**

### Teste rápido do fluxo completo:
- Vá em **Catálogo → Acessórios**: você deve ver as subcategorias (Carregadores, Cabos, etc.).
- Vá em **Catálogo → Material**: deve ter Sacola Plástica, Papel 1, Papel 2.
- Tente **adicionar um acessório** com foto → se a foto subir, o Storage está OK.

### Para parar o servidor:
- No terminal, aperte **`Ctrl + C`**.

---

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Your project's URL and API key are required` | `.env.local` vazio ou com erro | Confira o passo 4. Reinicie o `npm run dev` após editar o `.env.local` (ele só lê na inicialização). |
| Login não funciona / "Invalid credentials" | Usuário não confirmado | No passo 7.1, garanta que "Auto Confirm User" estava ligado. |
| Login funciona mas cai em "Aguardando aprovação" | Admin não foi promovido a Dono | Rode o SQL do passo 7.2. |
| Tabelas não aparecem | Migrations não rodaram ou fora de ordem | Rode `001` → `002` → `003` na ordem (passo 5). |
| Erro ao subir foto | Bucket errado ou não-público | Crie o bucket `fotos-itens` como **público** (passo 6). |
| Mudei o `.env.local` e nada mudou | Variáveis só carregam na inicialização | Pare (`Ctrl+C`) e rode `npm run dev` de novo. |
| `npm run dev` dá erro de módulo | Dependências não instaladas | Rode `npm install` antes. |
| Porta 3000 ocupada | Outro processo usando a porta | O Next sobe na 3001 automaticamente, ou feche o outro processo. |

---

## ✅ Checklist final

- [ ] Conta criada no Supabase
- [ ] Projeto `loja-alce` criado (região São Paulo)
- [ ] 3 credenciais copiadas (URL + anon + service_role)
- [ ] `.env.local` preenchido e salvo
- [ ] Migrations `001`, `002`, `003` rodadas na ordem
- [ ] Bucket `fotos-itens` criado como público
- [ ] Usuário admin criado e promovido a Dono
- [ ] `npm install` rodado
- [ ] `npm run dev` rodando e login do admin funcionando

Quando todos estiverem marcados, seu loja-alce está 100% operacional localmente! 🚀
