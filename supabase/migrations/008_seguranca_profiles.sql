-- =============================================
-- 008_seguranca_profiles.sql — Corrige escalada de privilégio
-- =============================================
-- A policy antiga de UPDATE permitia o usuário editar o PRÓPRIO profile sem
-- restrição de colunas — então um funcionário poderia se auto-promover a 'dono'
-- ou se auto-aprovar (status). Esta migração impede isso:
--   - o usuário comum só pode manter o mesmo cargo/status/unidade que já tem;
--   - o dono continua podendo alterar qualquer profile (aprovações, cargos).
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Usuário comum: pode atualizar o próprio profile, MAS o cargo, o status e a
-- unidade precisam permanecer os mesmos (não pode se promover/aprovar sozinho).
-- Mudanças nesses campos passam por fluxos próprios (dono aprova; solicitação
-- de cargo/unidade aprovada por gerente).
CREATE POLICY "profiles_update_self_safe" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND cargo = (SELECT cargo FROM profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM profiles WHERE id = auth.uid())
    AND unidade_id IS NOT DISTINCT FROM (SELECT unidade_id FROM profiles WHERE id = auth.uid())
  );

-- Dono: pode atualizar qualquer profile (aprovar cadastros, mudar cargos/unidades).
CREATE POLICY "profiles_update_dono" ON profiles
  FOR UPDATE
  USING (get_my_cargo() = 'dono')
  WITH CHECK (get_my_cargo() = 'dono');
