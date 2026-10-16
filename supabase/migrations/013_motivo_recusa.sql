-- =============================================
-- 013_motivo_recusa.sql — Motivo da recusa de uma sugestão
-- =============================================
-- Ao recusar uma sugestão, o gerente/dono escreve o motivo. Ele é mostrado
-- ao funcionário em "Minhas Sugestões" e vai na notificação de recusa.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

ALTER TABLE sugestoes
  ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;
