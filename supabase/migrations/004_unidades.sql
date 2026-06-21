-- =============================================
-- 004_unidades.sql — Multi-unidade (lojas)
-- =============================================
-- Adiciona o conceito de "unidade" (loja):
--   - tabela unidades
--   - profiles.unidade_id (funcionário/gerente pertencem a uma unidade base)
--   - pedidos.unidade_id (a unidade de onde o pedido saiu)
--   - gerente_unidades (N:N — um gerente pode gerir várias unidades)
-- Cria uma unidade padrão "Matriz" e liga os dados existentes a ela.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez (usa IF NOT EXISTS / ON CONFLICT).
-- =============================================

-- ==================== TABELA UNIDADES ====================
CREATE TABLE IF NOT EXISTS unidades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL UNIQUE,
  endereco    TEXT,
  codigo      TEXT UNIQUE,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== COLUNAS DE VÍNCULO ====================
-- Unidade base do usuário (funcionário/gerente). Dono pode ficar sem.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades(id) ON DELETE SET NULL;

-- Unidade de onde o pedido saiu (cópia da unidade do criador no momento).
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades(id) ON DELETE SET NULL;

-- ==================== GERENTE x UNIDADES (N:N) ====================
CREATE TABLE IF NOT EXISTS gerente_unidades (
  gerente_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unidade_id  UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (gerente_id, unidade_id)
);

-- ==================== UNIDADE PADRÃO + MIGRAÇÃO ====================
-- Cria a "Matriz" se ainda não existir
INSERT INTO unidades (nome) VALUES ('Matriz')
ON CONFLICT (nome) DO NOTHING;

-- Liga funcionários/gerentes sem unidade à Matriz
UPDATE profiles
SET unidade_id = (SELECT id FROM unidades WHERE nome = 'Matriz')
WHERE unidade_id IS NULL
  AND cargo IN ('funcionario', 'gerente');

-- Liga pedidos existentes sem unidade à Matriz
UPDATE pedidos
SET unidade_id = (SELECT id FROM unidades WHERE nome = 'Matriz')
WHERE unidade_id IS NULL;

-- ==================== FUNÇÕES HELPER ====================
-- IDs das unidades que o usuário atual pode ver:
--   - dono: todas
--   - gerente: as suas (gerente_unidades) + a sua unidade base
--   - funcionário: só a sua unidade base
CREATE OR REPLACE FUNCTION minhas_unidades()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM unidades WHERE get_my_cargo() = 'dono'
  UNION
  SELECT unidade_id FROM gerente_unidades WHERE gerente_id = auth.uid()
  UNION
  SELECT unidade_id FROM profiles WHERE id = auth.uid() AND unidade_id IS NOT NULL
$$;

-- ==================== RLS ====================
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE gerente_unidades ENABLE ROW LEVEL SECURITY;

-- Unidades: usuários aprovados podem ler (o dropdown de cadastro precisa ler,
-- mas o signup ocorre antes do login — por isso liberamos leitura a todos os
-- usuários autenticados; o cadastro lê via client anônimo, ver policy abaixo).
DROP POLICY IF EXISTS "unidades_select" ON unidades;
CREATE POLICY "unidades_select" ON unidades
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "unidades_admin" ON unidades;
CREATE POLICY "unidades_admin" ON unidades
  FOR ALL USING (get_my_cargo() = 'dono') WITH CHECK (get_my_cargo() = 'dono');

-- gerente_unidades: leitura para aprovados; escrita só dono
DROP POLICY IF EXISTS "gerente_unidades_select" ON gerente_unidades;
CREATE POLICY "gerente_unidades_select" ON gerente_unidades
  FOR SELECT USING (get_my_status() = 'aprovado');

DROP POLICY IF EXISTS "gerente_unidades_admin" ON gerente_unidades;
CREATE POLICY "gerente_unidades_admin" ON gerente_unidades
  FOR ALL USING (get_my_cargo() = 'dono') WITH CHECK (get_my_cargo() = 'dono');

-- ==================== TRIGGER handle_new_user (inclui unidade) ====================
-- Recria o trigger para gravar a unidade vinda do cadastro (raw_user_meta_data).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cargo, whatsapp, email, unidade_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cargo', 'funcionario'),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'unidade_id', '')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== RLS DE PEDIDOS POR UNIDADE ====================
-- Substitui o select de pedidos: cada um vê apenas pedidos das suas unidades.
-- (dono vê todas via minhas_unidades; gerente vê as suas; funcionário a sua.)
DROP POLICY IF EXISTS "pedidos_select" ON pedidos;
CREATE POLICY "pedidos_select" ON pedidos
  FOR SELECT USING (
    get_my_status() = 'aprovado'
    AND (
      unidade_id IS NULL                       -- pedidos antigos sem unidade
      OR unidade_id IN (SELECT minhas_unidades())
    )
  );
