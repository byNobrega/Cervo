-- =============================================
-- seeds/vincular_pedidos_madureira.sql
-- =============================================
-- As duas listas abertas foram criadas pelo usuário Administrador, que não tem
-- unidade. Sem unidade_id o app cai no padrão da coluna nome_loja ('Loja Alce')
-- e fica sem logo, porque a logo é escolhida pelo NOME da unidade.
-- Este script amarra cada lista à sua loja:
--   19/08 (236 itens) -> BR CELL - MADUREIRA SHOPPING 02
--   23/08 (202 itens) -> BR CELL - MADUREIRA SHOPPING 01
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- =============================================

UPDATE pedidos
SET unidade_id = (SELECT id FROM unidades WHERE nome = 'BR CELL - MADUREIRA SHOPPING 02'),
    nome_loja  = 'BR CELL - MADUREIRA SHOPPING 02'
WHERE status = 'aberta'
  AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = DATE '2026-08-19';

UPDATE pedidos
SET unidade_id = (SELECT id FROM unidades WHERE nome = 'BR CELL - MADUREIRA SHOPPING 01'),
    nome_loja  = 'BR CELL - MADUREIRA SHOPPING 01'
WHERE status = 'aberta'
  AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = DATE '2026-08-23';

-- Conferência: cada lista aberta com a sua unidade.
SELECT (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS data,
       u.nome AS unidade
FROM pedidos p
LEFT JOIN unidades u ON u.id = p.unidade_id
WHERE p.status = 'aberta'
ORDER BY p.created_at;

-- O Luan enxerga as duas lojas? O RLS de pedidos (004_unidades.sql) mostra ao
-- gerente só as unidades que ele gere. Se vier vazio, ele não vê as listas.
SELECT p.nome, p.cargo, ub.nome AS unidade_base, u.nome AS gerencia
FROM profiles p
LEFT JOIN unidades ub ON ub.id = p.unidade_id
LEFT JOIN gerente_unidades gu ON gu.gerente_id = p.id
LEFT JOIN unidades u ON u.id = gu.unidade_id
WHERE p.nome ILIKE 'luan%';

-- =============================================
-- 25/09/2026 — mesma correção para a lista de 21/09:
-- 221 itens, criada pelo Administrador sem unidade (saía como "Loja Alce").
-- Já APLICADA no banco nesta data; fica aqui como registro.
--   21/09 (221 itens) -> BR CELL - MADUREIRA SHOPPING 01
--
-- A partir de agora a tela de Novo Pedido pede a loja ao criar a lista
-- (seletor "Loja desta lista"), então esse conserto manual não deve repetir.
-- =============================================

UPDATE pedidos
SET unidade_id = (SELECT id FROM unidades WHERE nome = 'BR CELL - MADUREIRA SHOPPING 01'),
    nome_loja  = 'BR CELL - MADUREIRA SHOPPING 01'
WHERE status = 'aberta'
  AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = DATE '2026-09-21';
