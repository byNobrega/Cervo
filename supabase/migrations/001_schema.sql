-- =============================================
-- 001_schema.sql — Schema completo do loja-alce
-- =============================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== PERFIS ====================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cargo       TEXT NOT NULL CHECK (cargo IN ('dono', 'gerente', 'funcionario')),
  whatsapp    TEXT,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria profile automaticamente após signup
-- IMPORTANTE: SET search_path = public é obrigatório. Sem isso, a função
-- SECURITY DEFINER roda sem enxergar o schema public no contexto do signup
-- e o INSERT falha, abortando a criação do usuário com
-- "Database error creating new user".
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cargo, whatsapp, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cargo', 'funcionario'),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: atualiza updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==================== MARCAS E MODELOS ====================
CREATE TABLE marcas_celular (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome  TEXT NOT NULL UNIQUE
);

CREATE TABLE modelos_celular (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id        UUID NOT NULL REFERENCES marcas_celular(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  tem_tela_curva  BOOLEAN NOT NULL DEFAULT FALSE,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  ordem           INTEGER NOT NULL DEFAULT 9999, -- ordem de exibição (menor = primeiro)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(marca_id, nome)
);

-- ==================== ACESSÓRIOS ====================
CREATE TABLE subcategorias_acessorio (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome  TEXT NOT NULL UNIQUE
);

CREATE TABLE acessorios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  marca           TEXT,
  subcategoria_id UUID REFERENCES subcategorias_acessorio(id) ON DELETE SET NULL,
  foto_url        TEXT NOT NULL,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CAPAS ====================
CREATE TABLE subcategorias_capa (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL UNIQUE,
  foto_url   TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subcategoria_capa_marcas (
  subcategoria_id UUID NOT NULL REFERENCES subcategorias_capa(id) ON DELETE CASCADE,
  marca_id        UUID NOT NULL REFERENCES marcas_celular(id) ON DELETE CASCADE,
  PRIMARY KEY (subcategoria_id, marca_id)
);

-- ==================== PELÍCULAS ====================
CREATE TABLE tipos_pelicula_maquina (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome     TEXT NOT NULL UNIQUE,
  tipo     TEXT NOT NULL DEFAULT 'maquina',
  foto_url TEXT
);

CREATE TABLE tipos_pelicula_tradicional (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE
);

-- ==================== MATERIAL DE LOJA ====================
CREATE TABLE material_loja (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL UNIQUE,
  foto_url   TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SUGESTÕES ====================
CREATE TABLE sugestoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT NOT NULL CHECK (tipo IN ('acessorio', 'capa_subcategoria', 'material')),
  sugerido_por    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  marca           TEXT,
  subcategoria_id UUID REFERENCES subcategorias_acessorio(id) ON DELETE SET NULL,
  foto_url        TEXT,
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  revisado_por    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revisado_em     TIMESTAMPTZ,
  item_criado_id  UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PEDIDOS ====================
CREATE TABLE pedidos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_por       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  concluido_por    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'aberta'
                     CHECK (status IN ('aberta', 'concluida')),
  nome_loja        TEXT NOT NULL DEFAULT 'Loja Alce',
  observacao_geral TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  concluido_em     TIMESTAMPTZ
);

CREATE TABLE pedido_itens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  categoria           TEXT NOT NULL CHECK (categoria IN (
                        'acessorio', 'capa', 'pelicula_maquina', 'pelicula_tradicional', 'material'
                      )),
  -- referências opcionais (apenas uma preenchida por vez)
  acessorio_id        UUID REFERENCES acessorios(id) ON DELETE SET NULL,
  sugestao_id         UUID REFERENCES sugestoes(id) ON DELETE SET NULL,
  subcapa_id          UUID REFERENCES subcategorias_capa(id) ON DELETE SET NULL,
  modelo_id           UUID REFERENCES modelos_celular(id) ON DELETE SET NULL,
  tipo_peli_maq_id    UUID REFERENCES tipos_pelicula_maquina(id) ON DELETE SET NULL,
  tipo_peli_trad_id   UUID REFERENCES tipos_pelicula_tradicional(id) ON DELETE SET NULL,
  material_id         UUID REFERENCES material_loja(id) ON DELETE SET NULL,
  -- snapshot para preservar histórico
  nome_snapshot       TEXT NOT NULL,
  foto_url_snapshot   TEXT,
  -- dados do item
  observacao          TEXT,
  status              TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'comprado', 'nao_tem')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== NOTIFICAÇÕES ====================
CREATE TABLE notificacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  para_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN (
               'pedido_criado', 'item_sugerido', 'pedido_concluido',
               'cadastro_pendente', 'sugestao_aprovada', 'sugestao_rejeitada',
               'cadastro_aprovado', 'cadastro_rejeitado', 'alerta'
             )),
  titulo     TEXT NOT NULL,
  mensagem   TEXT,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  link       TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ALERTAS ====================
CREATE TABLE alertas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           TEXT NOT NULL CHECK (tipo IN ('frequencia_alta', 'nao_tem_recorrente')),
  item_nome      TEXT NOT NULL,
  categoria      TEXT,
  item_id        UUID,
  contagem       INT NOT NULL DEFAULT 0,
  periodo_inicio DATE,
  periodo_fim    DATE,
  resolvido      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== FUNÇÕES HELPER ====================
CREATE OR REPLACE FUNCTION get_my_cargo()
RETURNS TEXT AS $$
  SELECT cargo FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_status()
RETURNS TEXT AS $$
  SELECT status FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
