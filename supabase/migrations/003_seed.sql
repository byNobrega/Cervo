-- =============================================
-- 003_seed.sql — Dados iniciais
-- =============================================

-- Marcas de celular
INSERT INTO marcas_celular (nome) VALUES
  ('Apple'), ('Samsung'), ('Motorola'), ('Redmi'), ('Realme'), ('Xiaomi')
ON CONFLICT (nome) DO NOTHING;

-- Subcategorias de acessório
INSERT INTO subcategorias_acessorio (nome) VALUES
  ('Carregadores'), ('Cabos'), ('Fones Bluetooth'), ('Fones de Fio'),
  ('Caixas de Som'), ('Joystick'), ('Acessórios Variados')
ON CONFLICT (nome) DO NOTHING;

-- Subcategorias de capa
INSERT INTO subcategorias_capa (nome) VALUES
  ('Capa Case'), ('Case Transparente'), ('Space'), ('Space Transparente'),
  ('Capa Couro'), ('Capa Brilhosa com Indução'),
  ('Capa Vidro'), ('Capa Indução com Película de Câmera')
ON CONFLICT (nome) DO NOTHING;

-- Todas as subcategorias de capa suportam todas as marcas por padrão
INSERT INTO subcategoria_capa_marcas (subcategoria_id, marca_id)
SELECT sc.id, m.id
FROM subcategorias_capa sc
CROSS JOIN marcas_celular m
ON CONFLICT DO NOTHING;

-- Películas máquina (lista fixa)
INSERT INTO tipos_pelicula_maquina (nome, tipo) VALUES
  ('Soft', 'maquina'),
  ('Fosca (Gamer)', 'maquina'),
  ('Soft Privativa', 'maquina'),
  ('Fosca Privativa', 'maquina')
ON CONFLICT (nome) DO NOTHING;

-- Películas tradicionais (lista fixa)
INSERT INTO tipos_pelicula_tradicional (nome) VALUES
  ('Vidro 3D'), ('Cerâmica')
ON CONFLICT (nome) DO NOTHING;

-- Material de loja inicial
INSERT INTO material_loja (nome) VALUES
  ('Sacola Plástica'), ('Papel 1'), ('Papel 2')
ON CONFLICT (nome) DO NOTHING;

-- =============================================
-- NOTA: O usuário admin (admin@lojaalce.com / admin123) deve ser criado
-- manualmente via Supabase Dashboard > Authentication > Users
-- e então executar:
--
-- UPDATE profiles
-- SET cargo = 'dono', status = 'aprovado'
-- WHERE email = 'admin@lojaalce.com';
--
-- Ou via a rota /api/seed (apenas em desenvolvimento).
-- =============================================
