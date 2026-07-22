-- =============================================
-- 010_item_subgrupo_snapshot.sql — Subgrupo gravado no item
-- =============================================
-- Grava o nome da subcategoria/tipo direto no item do pedido (snapshot), para
-- a visualização agrupar corretamente SEM depender do JOIN com o catálogo.
-- Assim, mesmo que o acessório seja excluído do catálogo (ou o vínculo se perca),
-- o pedido continua mostrando os itens na subcategoria certa.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

ALTER TABLE pedido_itens
  ADD COLUMN IF NOT EXISTS subgrupo_snapshot TEXT;
