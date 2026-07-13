# Roadmap — Antes de ir para produção

Lista de tarefas a concluir antes de colocar o Cervo online.

## Conteúdo (feito pela tela, como Gerente/Dono)

- [ ] **1. Acessórios** — cadastrar cada acessório com foto e nome.
- [ ] **2. Novos modelos de capa** — cadastrar os modelos/linhas de capa que faltam.
- [ ] **3. Capas** — subir a foto de cada modelo de capa (ex: Vidro, Capa Case, Couro...).

## Segurança

- [ ] **4. Testes de segurança** — revisar permissões (RLS) e proteção dos dados.
      O deploy online só acontece **depois** desta etapa.

## Integrações

- [ ] **5. Z-API (WhatsApp)** — adiado por enquanto; não entra no primeiro momento.
  - [ ] **5a. Lista visual (imagem) por WhatsApp** — em vez de só texto, enviar a
        lista de capa/película como uma IMAGEM (PNG) no formato tabela: nome do
        modelo + foto do produto ao lado, para facilitar o reconhecimento de quem
        separa o pedido.
        Ex:
        ```
        CAPA VIDRO        [foto]
        16                [foto]
        17                [foto]
        15 Pro            [foto]
        ```
        Depende do Z-API estar ligado. Implementação: renderizar a lista como
        imagem no servidor (ex: @vercel/og / satori ou node-canvas), hospedar/
        servir o PNG e enviar pelo endpoint de imagem do Z-API.

---

## Deploy

O upload para produção (Vercel) ocorre **somente após concluir os testes de segurança (item 4)**.
