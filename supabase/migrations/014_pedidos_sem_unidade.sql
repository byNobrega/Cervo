-- =============================================
-- 014_pedidos_sem_unidade.sql — Pedidos sem loja só para dono/gerente
-- =============================================
-- A regra da 004 já limita cada usuário aos pedidos das suas unidades
-- (funcionário: só a loja dele). Mas pedidos antigos SEM unidade apareciam
-- para todo mundo. Agora esses ficam visíveis apenas para dono e gerente.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

DROP POLICY IF EXISTS "pedidos_select" ON pedidos;
CREATE POLICY "pedidos_select" ON pedidos
  FOR SELECT USING (
    get_my_status() = 'aprovado'
    AND (
      unidade_id IN (SELECT minhas_unidades())
      OR (unidade_id IS NULL AND get_my_cargo() IN ('dono', 'gerente'))
    )
  );
