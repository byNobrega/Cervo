-- =============================================
-- seeds/pedidos_delete_policy.sql — Permite excluir pedidos via RLS
-- =============================================
-- A tabela pedidos não tinha policy de DELETE, então toda exclusão era
-- bloqueada. Esta policy autoriza:
--   - dono/gerente: excluir pedidos das suas unidades
--   - funcionário: excluir apenas os próprios pedidos
-- (A regra dos 15 minutos do funcionário é validada na server action.)
--
-- Como rodar: SQL Editor > New query > cole tudo > Run. Seguro repetir.
-- =============================================

DROP POLICY IF EXISTS "pedidos_delete" ON pedidos;
CREATE POLICY "pedidos_delete" ON pedidos
  FOR DELETE USING (
    get_my_status() = 'aprovado'
    AND (
      get_my_cargo() IN ('dono', 'gerente')
      OR criado_por = auth.uid()
    )
  );
