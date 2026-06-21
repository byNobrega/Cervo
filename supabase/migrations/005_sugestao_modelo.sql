-- =============================================
-- 005_sugestao_modelo.sql — Sugestão de MODELO de aparelho (para películas)
-- =============================================
-- Permite o funcionário sugerir um modelo de celular novo (ex: aparelho
-- recém-lançado que ainda não está no catálogo). Ao aprovar, o gerente cria
-- o modelo em modelos_celular, que passa a aparecer em todas as películas.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

-- 1) Adiciona 'modelo' aos tipos de sugestão aceitos.
ALTER TABLE sugestoes DROP CONSTRAINT IF EXISTS sugestoes_tipo_check;
ALTER TABLE sugestoes
  ADD CONSTRAINT sugestoes_tipo_check
  CHECK (tipo IN ('acessorio', 'capa_subcategoria', 'material', 'modelo'));

-- 2) Campos extras usados quando tipo = 'modelo'.
ALTER TABLE sugestoes
  ADD COLUMN IF NOT EXISTS marca_id UUID REFERENCES marcas_celular(id) ON DELETE SET NULL;
ALTER TABLE sugestoes
  ADD COLUMN IF NOT EXISTS tem_tela_curva BOOLEAN NOT NULL DEFAULT FALSE;
