-- =============================================
-- 012_pedido_emergente.sql — Tipo de pedido (normal / emergente)
-- =============================================
-- "Pedido Emergente": itens que acabaram rápido e precisam ser repostos na
-- hora, para o gerente (Luan / Lucas) fazer uma compra rápida e a loja não
-- perder venda. Não é um pedido diferente — é a mesma lista, com prioridade:
-- aparece no topo dos pedidos em aberto, com selo vermelho, e o aviso que vai
-- para o WhatsApp do gerente sai marcado como emergente.
--
-- Como rodar: SQL Editor > New query > cole tudo > Run.
-- Seguro rodar mais de uma vez.
-- =============================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'normal';

-- CHECK em passo separado (ADD COLUMN IF NOT EXISTS não aceita a constraint
-- de forma idempotente: rodar de novo tentaria recriá-la).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_tipo_check') THEN
    ALTER TABLE pedidos
      ADD CONSTRAINT pedidos_tipo_check CHECK (tipo IN ('normal', 'emergente'));
  END IF;
END $$;

-- Conferência: todos os pedidos existentes viram 'normal' pelo DEFAULT.
SELECT tipo, COUNT(*) FROM pedidos GROUP BY tipo;
