-- =============================================
-- backfill_sugestoes_capa_aprovadas.sql
-- =============================================
-- Corrige sugestões de CAPA que foram aprovadas antes do conserto do
-- aprovarSugestao: elas ficaram com status 'aprovado' mas nenhuma
-- subcategoria de capa foi criada (item_criado_id vazio).
--
-- O que faz, para cada uma dessas sugestões:
--   1) cria a subcategoria de capa (ou reativa, se já existir com o mesmo nome)
--   2) vincula todas as marcas (ajuste depois em Catálogo > Capas)
--   3) grava o item_criado_id na sugestão
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

-- 0) (Opcional) Ver o que vai ser corrigido:
-- SELECT id, nome, tipo, status, item_criado_id FROM sugestoes
-- WHERE status = 'aprovado' AND item_criado_id IS NULL;

DO $$
DECLARE
  s   RECORD;
  sub UUID;
BEGIN
  FOR s IN
    SELECT id, nome, foto_url FROM sugestoes
    WHERE tipo = 'capa_subcategoria'
      AND status = 'aprovado'
      AND item_criado_id IS NULL
  LOOP
    SELECT id INTO sub FROM subcategorias_capa WHERE lower(nome) = lower(s.nome) LIMIT 1;

    IF sub IS NULL THEN
      INSERT INTO subcategorias_capa (nome, foto_url)
      VALUES (s.nome, s.foto_url)
      RETURNING id INTO sub;

      INSERT INTO subcategoria_capa_marcas (subcategoria_id, marca_id)
      SELECT sub, m.id FROM marcas_celular m
      ON CONFLICT DO NOTHING;
    ELSE
      UPDATE subcategorias_capa SET ativo = TRUE WHERE id = sub;
    END IF;

    UPDATE sugestoes SET item_criado_id = sub WHERE id = s.id;
  END LOOP;
END $$;

-- Confere o resultado:
SELECT s.nome AS sugestao, sc.nome AS capa_criada, sc.ativo
FROM sugestoes s
JOIN subcategorias_capa sc ON sc.id = s.item_criado_id
WHERE s.tipo = 'capa_subcategoria' AND s.status = 'aprovado';
