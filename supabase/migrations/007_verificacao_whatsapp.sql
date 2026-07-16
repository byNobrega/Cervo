-- =============================================
-- 007_verificacao_whatsapp.sql — Confirmação de número no cadastro
-- =============================================
-- Guarda os códigos enviados por WhatsApp para verificar o número de quem
-- está se cadastrando. O código é validado ANTES de a conta ser criada.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

CREATE TABLE IF NOT EXISTS verificacoes_whatsapp (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone    TEXT NOT NULL,              -- só dígitos, com DDI (ex: 5521999999999)
  codigo      TEXT NOT NULL,              -- código de 6 dígitos
  expira_em   TIMESTAMPTZ NOT NULL,
  usado       BOOLEAN NOT NULL DEFAULT FALSE,
  tentativas  INT NOT NULL DEFAULT 0,     -- trava força bruta
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Busca rápida pelo telefone (o fluxo consulta sempre por número).
CREATE INDEX IF NOT EXISTS idx_verif_whats_telefone
  ON verificacoes_whatsapp (telefone, created_at DESC);

-- RLS: ninguém acessa direto pelo client. Toda a manipulação é feita por
-- server actions com a service_role (que ignora RLS). Sem policies = negado.
ALTER TABLE verificacoes_whatsapp ENABLE ROW LEVEL SECURITY;
