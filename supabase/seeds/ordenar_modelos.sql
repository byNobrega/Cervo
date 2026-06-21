-- =============================================
-- seeds/ordenar_modelos.sql — Ordem de exibição dos modelos
-- =============================================
--
-- Adiciona a coluna `ordem` (se ainda não existir) e numera os iPhones
-- na sequência de lançamento (8 → 16 Pro Max), em vez da ordem alfabética.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- É seguro rodar mais de uma vez.
-- =============================================

-- 1) Cria a coluna de ordenação (default 9999 = vai pro fim se não numerado)
ALTER TABLE modelos_celular
  ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 9999;

-- 2) Numera os iPhones na ordem desejada
WITH ordem_iphones(nome, ordem) AS (VALUES
  ('iPhone 8',            1),
  ('iPhone 8 Plus',       2),
  ('iPhone X',            3),
  ('iPhone XS',           4),
  ('iPhone XS Max',       5),
  ('iPhone XR',           6),
  ('iPhone 11',           7),
  ('iPhone 11 Pro',       8),
  ('iPhone 11 Pro Max',   9),
  ('iPhone SE (2020)',   10),
  ('iPhone 12',          11),
  ('iPhone 12 mini',     12),
  ('iPhone 12 Pro',      13),
  ('iPhone 12 Pro Max',  14),
  ('iPhone 13',          15),
  ('iPhone 13 mini',     16),
  ('iPhone 13 Pro',      17),
  ('iPhone 13 Pro Max',  18),
  ('iPhone SE (2022)',   19),
  ('iPhone 14',          20),
  ('iPhone 14 Plus',     21),
  ('iPhone 14 Pro',      22),
  ('iPhone 14 Pro Max',  23),
  ('iPhone 15',          24),
  ('iPhone 15 Plus',     25),
  ('iPhone 15 Pro',      26),
  ('iPhone 15 Pro Max',  27),
  ('iPhone 16',          28),
  ('iPhone 16 Plus',     29),
  ('iPhone 16 Pro',      30),
  ('iPhone 16 Pro Max',  31)
)
UPDATE modelos_celular mc
SET ordem = oi.ordem
FROM ordem_iphones oi, marcas_celular m
WHERE mc.nome = oi.nome
  AND mc.marca_id = m.id
  AND m.nome = 'Apple';
