-- =============================================
-- 011_pelicula_trad_foto.sql — Foto de referência no tipo de película tradicional
-- =============================================
-- Os tipos de película tradicional (Cerâmica, Vidro 3D, etc.) passam a ter uma
-- foto de referência, para a imagem da lista enviada por WhatsApp — igual às
-- capas. (tipos_pelicula_maquina já possui foto_url.)
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

ALTER TABLE tipos_pelicula_tradicional
  ADD COLUMN IF NOT EXISTS foto_url TEXT;
