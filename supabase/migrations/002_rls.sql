-- =============================================
-- 002_rls.sql — Row Level Security policies
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas_celular ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_celular ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias_acessorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE acessorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias_capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategoria_capa_marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_pelicula_maquina ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_pelicula_tradicional ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES ====================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_my_cargo() = 'dono'
    OR (get_my_status() = 'aprovado' AND get_my_cargo() IN ('gerente'))
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR get_my_cargo() = 'dono');

-- Permite o INSERT do próprio profile (necessário para o trigger handle_new_user
-- conseguir criar o profile durante o signup; sem isto o RLS bloqueia o INSERT
-- e a criação do usuário falha com "Database error creating new user").
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Dono pode ver todos os profiles (para aprovar cadastros)
CREATE POLICY "profiles_select_dono" ON profiles
  FOR SELECT USING (get_my_cargo() = 'dono');

-- ==================== MARCAS E MODELOS ====================
CREATE POLICY "marcas_select_aprovados" ON marcas_celular
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "marcas_insert_dono" ON marcas_celular
  FOR INSERT WITH CHECK (get_my_cargo() = 'dono');

CREATE POLICY "marcas_update_dono" ON marcas_celular
  FOR UPDATE USING (get_my_cargo() = 'dono');

CREATE POLICY "marcas_delete_dono" ON marcas_celular
  FOR DELETE USING (get_my_cargo() = 'dono');

CREATE POLICY "modelos_select_aprovados" ON modelos_celular
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "modelos_insert_dono" ON modelos_celular
  FOR INSERT WITH CHECK (get_my_cargo() = 'dono');

CREATE POLICY "modelos_update_dono" ON modelos_celular
  FOR UPDATE USING (get_my_cargo() = 'dono');

CREATE POLICY "modelos_delete_dono" ON modelos_celular
  FOR DELETE USING (get_my_cargo() = 'dono');

-- ==================== ACESSÓRIOS ====================
CREATE POLICY "subcategorias_acessorio_select" ON subcategorias_acessorio
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "subcategorias_acessorio_insert" ON subcategorias_acessorio
  FOR INSERT WITH CHECK (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "acessorios_select" ON acessorios
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "acessorios_insert" ON acessorios
  FOR INSERT WITH CHECK (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "acessorios_update" ON acessorios
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "acessorios_delete" ON acessorios
  FOR DELETE USING (get_my_cargo() = 'dono');

-- ==================== CAPAS ====================
CREATE POLICY "subcategorias_capa_select" ON subcategorias_capa
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "subcategorias_capa_insert" ON subcategorias_capa
  FOR INSERT WITH CHECK (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "subcategorias_capa_update" ON subcategorias_capa
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "subcategoria_capa_marcas_select" ON subcategoria_capa_marcas
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "subcategoria_capa_marcas_insert" ON subcategoria_capa_marcas
  FOR INSERT WITH CHECK (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "subcategoria_capa_marcas_delete" ON subcategoria_capa_marcas
  FOR DELETE USING (get_my_cargo() IN ('gerente', 'dono'));

-- ==================== PELÍCULAS (somente leitura para usuários) ====================
CREATE POLICY "pelicula_maquina_select" ON tipos_pelicula_maquina
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "pelicula_maquina_insert" ON tipos_pelicula_maquina
  FOR INSERT WITH CHECK (get_my_cargo() = 'dono');

CREATE POLICY "pelicula_tradicional_select" ON tipos_pelicula_tradicional
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "pelicula_tradicional_insert" ON tipos_pelicula_tradicional
  FOR INSERT WITH CHECK (get_my_cargo() = 'dono');

-- ==================== MATERIAL DE LOJA ====================
CREATE POLICY "material_select" ON material_loja
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "material_insert" ON material_loja
  FOR INSERT WITH CHECK (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "material_update" ON material_loja
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "material_delete" ON material_loja
  FOR DELETE USING (get_my_cargo() = 'dono');

-- ==================== SUGESTÕES ====================
CREATE POLICY "sugestoes_select" ON sugestoes
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "sugestoes_insert" ON sugestoes
  FOR INSERT WITH CHECK (
    get_my_status() = 'aprovado'
    AND get_my_cargo() IN ('funcionario', 'gerente', 'dono')
  );

CREATE POLICY "sugestoes_update_revisor" ON sugestoes
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

-- ==================== PEDIDOS ====================
CREATE POLICY "pedidos_select" ON pedidos
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "pedidos_insert" ON pedidos
  FOR INSERT WITH CHECK (
    get_my_status() = 'aprovado'
    AND get_my_cargo() IN ('funcionario', 'gerente', 'dono')
  );

CREATE POLICY "pedidos_update" ON pedidos
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "pedidos_delete" ON pedidos
  FOR DELETE USING (
    get_my_status() = 'aprovado'
    AND (get_my_cargo() IN ('dono', 'gerente') OR criado_por = auth.uid())
  );

-- ==================== PEDIDO ITENS ====================
CREATE POLICY "pedido_itens_select" ON pedido_itens
  FOR SELECT USING (get_my_status() = 'aprovado');

CREATE POLICY "pedido_itens_insert" ON pedido_itens
  FOR INSERT WITH CHECK (
    get_my_status() = 'aprovado'
    AND get_my_cargo() IN ('funcionario', 'gerente', 'dono')
  );

CREATE POLICY "pedido_itens_update_status" ON pedido_itens
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

-- ==================== NOTIFICAÇÕES ====================
CREATE POLICY "notificacoes_select_destinatario" ON notificacoes
  FOR SELECT USING (para_id = auth.uid());

CREATE POLICY "notificacoes_update_lida" ON notificacoes
  FOR UPDATE USING (para_id = auth.uid());

-- Service role pode inserir notificações (via Server Actions)
CREATE POLICY "notificacoes_insert_service" ON notificacoes
  FOR INSERT WITH CHECK (TRUE); -- controlado pela service role key no servidor

-- ==================== ALERTAS ====================
CREATE POLICY "alertas_select" ON alertas
  FOR SELECT USING (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "alertas_update" ON alertas
  FOR UPDATE USING (get_my_cargo() IN ('gerente', 'dono'));

CREATE POLICY "alertas_insert_service" ON alertas
  FOR INSERT WITH CHECK (TRUE);
