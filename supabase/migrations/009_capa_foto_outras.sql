-- =============================================
-- 009_capa_foto_outras.sql — Segunda foto de referência da capa
-- =============================================
-- A subcategoria de capa passa a ter DUAS fotos de referência:
--   - foto_url         : usada para Apple/iPhone (já existente)
--   - foto_url_outras  : usada para as demais marcas (Samsung, Motorola, etc.)
-- Serve para a imagem da lista enviada por WhatsApp mostrar a capa correta
-- por marca, sem precisar criar outra subcategoria.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

ALTER TABLE subcategorias_capa
  ADD COLUMN IF NOT EXISTS foto_url_outras TEXT;
