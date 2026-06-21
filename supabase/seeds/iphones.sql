-- =============================================
-- seeds/iphones.sql — Insere todos os modelos de iPhone
-- =============================================
--
-- Como rodar:
--   1. Supabase Dashboard > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em Run
--
-- É seguro rodar mais de uma vez (idempotente): a constraint
-- UNIQUE(marca_id, nome) + ON CONFLICT DO NOTHING evita duplicar.
--
-- Observações:
--   - Busca o id da marca "Apple" automaticamente (não precisa saber o UUID).
--   - tem_tela_curva = FALSE para todos (iPhones não têm tela curva;
--     isso libera todos eles para películas tradicionais Vidro 3D/Cerâmica).
-- =============================================

INSERT INTO modelos_celular (marca_id, nome, tem_tela_curva)
SELECT m.id, modelo.nome, FALSE
FROM marcas_celular m
CROSS JOIN (VALUES
  ('iPhone 8'),
  ('iPhone 8 Plus'),
  ('iPhone X'),
  ('iPhone XS'),
  ('iPhone XS Max'),
  ('iPhone XR'),
  ('iPhone 11'),
  ('iPhone 11 Pro'),
  ('iPhone 11 Pro Max'),
  ('iPhone SE (2020)'),
  ('iPhone 12'),
  ('iPhone 12 mini'),
  ('iPhone 12 Pro'),
  ('iPhone 12 Pro Max'),
  ('iPhone 13'),
  ('iPhone 13 mini'),
  ('iPhone 13 Pro'),
  ('iPhone 13 Pro Max'),
  ('iPhone SE (2022)'),
  ('iPhone 14'),
  ('iPhone 14 Plus'),
  ('iPhone 14 Pro'),
  ('iPhone 14 Pro Max'),
  ('iPhone 15'),
  ('iPhone 15 Plus'),
  ('iPhone 15 Pro'),
  ('iPhone 15 Pro Max'),
  ('iPhone 16'),
  ('iPhone 16 Plus'),
  ('iPhone 16 Pro'),
  ('iPhone 16 Pro Max')
) AS modelo(nome)
WHERE m.nome = 'Apple'
ON CONFLICT (marca_id, nome) DO NOTHING;
