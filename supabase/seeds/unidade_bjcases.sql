-- =============================================
-- seeds/unidade_bjcases.sql — Unidade BJ CASES - TOP SHOPPING
-- =============================================
-- Insere a unidade e associa Lucas (gerente) e Duda (funcionária).
--
-- PRÉ-REQUISITO: a migration 004_unidades.sql já deve ter sido rodada.
-- Lucas e Duda precisam já estar cadastrados (tabela profiles) para serem
-- associados — se ainda não cadastraram, rode este seed depois que eles se
-- cadastrarem, ou apenas a parte da unidade roda e os vínculos ficam para depois.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run. Seguro repetir.
-- =============================================

-- (Opcional) coluna de código curto da unidade
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;

-- 1) Insere a unidade
INSERT INTO unidades (nome, endereco, codigo)
VALUES ('BJ CASES - TOP SHOPPING', 'Top Shopping, Rio de Janeiro, RJ', 'BJCASES_TOP')
ON CONFLICT (nome) DO UPDATE
  SET endereco = EXCLUDED.endereco,
      codigo = EXCLUDED.codigo;

-- 2) Associa Duda como FUNCIONÁRIA desta unidade (unidade base no profile)
UPDATE profiles
SET unidade_id = (SELECT id FROM unidades WHERE codigo = 'BJCASES_TOP'),
    cargo = 'funcionario'
WHERE nome ILIKE 'duda%';

-- 3) Associa Lucas como GERENTE: define unidade base + vínculo de gestão (N:N)
UPDATE profiles
SET unidade_id = (SELECT id FROM unidades WHERE codigo = 'BJCASES_TOP'),
    cargo = 'gerente'
WHERE nome ILIKE 'lucas%';

INSERT INTO gerente_unidades (gerente_id, unidade_id)
SELECT p.id, (SELECT id FROM unidades WHERE codigo = 'BJCASES_TOP')
FROM profiles p
WHERE p.nome ILIKE 'lucas%'
ON CONFLICT DO NOTHING;

-- 4) Conferência: mostra a unidade e quem está vinculado
SELECT 'UNIDADE' AS tipo, nome, codigo, endereco
FROM unidades WHERE codigo = 'BJCASES_TOP';

SELECT p.nome, p.cargo, p.status,
       (SELECT nome FROM unidades u WHERE u.id = p.unidade_id) AS unidade_base
FROM profiles p
WHERE p.nome ILIKE 'lucas%' OR p.nome ILIKE 'duda%';
