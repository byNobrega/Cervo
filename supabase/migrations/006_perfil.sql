-- =============================================
-- 006_perfil.sql — Aba "Meu Perfil"
-- =============================================
-- Suporta:
--   - foto de perfil (avatar_url em profiles)
--   - troca de número com histórico (whatsapp_anterior / whatsapp_alterado_em)
--   - solicitações de mudança de cargo/unidade com aprovação do gerente/dono
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

-- ==================== COLUNAS EM PROFILES ====================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- Número de WhatsApp anterior (para fallback/histórico do Z-API).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_anterior TEXT;
-- Quando o número foi trocado pela última vez.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_alterado_em TIMESTAMPTZ;

-- ==================== SOLICITAÇÕES DE PERFIL ====================
-- Pedidos de mudança de cargo/unidade que aguardam aprovação de gerente/dono.
CREATE TABLE IF NOT EXISTS solicitacoes_perfil (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('cargo', 'unidade')),
  -- valor solicitado
  cargo_novo    TEXT CHECK (cargo_novo IN ('funcionario', 'gerente')),
  unidade_nova  UUID REFERENCES unidades(id) ON DELETE SET NULL,
  -- snapshot do valor atual no momento do pedido (para exibir "de X para Y")
  cargo_atual    TEXT,
  unidade_atual  UUID REFERENCES unidades(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  revisado_por  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revisado_em   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE solicitacoes_perfil ENABLE ROW LEVEL SECURITY;

-- O solicitante vê as suas; gerente/dono veem todas (para revisar).
DROP POLICY IF EXISTS "solic_perfil_select" ON solicitacoes_perfil;
CREATE POLICY "solic_perfil_select" ON solicitacoes_perfil
  FOR SELECT USING (
    solicitante = auth.uid()
    OR get_my_cargo() IN ('gerente', 'dono')
  );

-- Qualquer aprovado pode criar a sua própria solicitação.
DROP POLICY IF EXISTS "solic_perfil_insert" ON solicitacoes_perfil;
CREATE POLICY "solic_perfil_insert" ON solicitacoes_perfil
  FOR INSERT WITH CHECK (
    solicitante = auth.uid() AND get_my_status() = 'aprovado'
  );

-- Só gerente/dono revisam (atualizam o status).
DROP POLICY IF EXISTS "solic_perfil_update" ON solicitacoes_perfil;
CREATE POLICY "solic_perfil_update" ON solicitacoes_perfil
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

-- ==================== STORAGE: AVATARES ====================
-- Reaproveita o bucket 'fotos-itens' (já público) numa pasta 'avatares',
-- então não é preciso criar bucket novo. Nada a fazer aqui.
