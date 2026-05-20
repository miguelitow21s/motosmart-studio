-- ============================================================
-- MotoSmart Studio — Schema Inicial
-- Migración: 001_initial_schema
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIPOS ENUM
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'designer', 'production', 'client');

CREATE TYPE order_status AS ENUM (
  'received',
  'designing',
  'production',
  'sewing',
  'finished',
  'delivered'
);

CREATE TYPE work_type AS ENUM (
  'cover',
  'foam',
  'embroidery',
  'design',
  'full_custom',
  'repair'
);

CREATE TYPE material_type AS ENUM (
  'vinyl',
  'leather',
  'neoprene',
  'fabric',
  'other'
);

CREATE TYPE file_type AS ENUM (
  'logo',
  'reference',
  'final_photo',
  'other'
);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: users (perfil extendido de auth.users)
-- ============================================================

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'production',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_users_role ON public.users(role);

-- Crear perfil automáticamente cuando se registra un usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'production')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLA: clients
-- ============================================================

CREATE TABLE public.clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_clients_deleted_at ON public.clients(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLA: motorcycles (catálogo de modelos)
-- ============================================================

CREATE TABLE public.motorcycles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INTEGER CHECK (year >= 1950 AND year <= 2100),
  displacement  TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_motorcycles_brand_model ON public.motorcycles(brand, model);
CREATE INDEX idx_motorcycles_active ON public.motorcycles(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLA: materials (catálogo de materiales)
-- ============================================================

CREATE TABLE public.materials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        material_type NOT NULL,
  color_hex   TEXT CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  texture_url TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_type ON public.materials(type);
CREATE INDEX idx_materials_active ON public.materials(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLA: embroideries (catálogo de bordados disponibles)
-- ============================================================

CREATE TABLE public.embroideries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_embroideries_active ON public.embroideries(is_active) WHERE is_active = TRUE;

-- ============================================================
-- SECUENCIA: serial de pedidos (001, 002, ...)
-- ============================================================

CREATE SEQUENCE order_serial_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- ============================================================
-- TABLA: orders (pedidos - entidad central)
-- ============================================================

CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial            TEXT NOT NULL UNIQUE DEFAULT LPAD(nextval('order_serial_seq')::TEXT, 3, '0'),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  motorcycle_id     UUID REFERENCES public.motorcycles(id) ON DELETE SET NULL,
  motorcycle_custom TEXT,
  work_type         work_type NOT NULL,
  status            order_status NOT NULL DEFAULT 'received',
  total_price       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  deposit           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  balance           NUMERIC(12,2) GENERATED ALWAYS AS (total_price - deposit) STORED,
  delivery_date     DATE,
  notes             TEXT,
  public_token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by        UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT deposit_lte_total CHECK (deposit <= total_price)
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_orders_serial ON public.orders(serial);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX idx_orders_created_by ON public.orders(created_by);
CREATE INDEX idx_orders_public_token ON public.orders(public_token);
CREATE INDEX idx_orders_deleted_at ON public.orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================================
-- TABLA: order_status_history (historial de cambios de estado)
-- ============================================================

CREATE TABLE public.order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status      order_status NOT NULL,
  notes       TEXT,
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- Trigger: registrar automáticamente el estado inicial al crear pedido
CREATE OR REPLACE FUNCTION record_initial_order_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.order_status_history (order_id, status, notes, created_by)
  VALUES (NEW.id, NEW.status, 'Pedido creado', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION record_initial_order_status();

-- Trigger: registrar en historial cuando cambia el estado
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, created_by)
    VALUES (NEW.id, NEW.status, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION record_order_status_change();

-- ============================================================
-- TABLA: seat_templates (plantillas SVG por modelo de moto)
-- ============================================================

CREATE TABLE public.seat_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motorcycle_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  svg_content   TEXT NOT NULL,
  fabric_json   JSONB,
  preview_url   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER seat_templates_updated_at
  BEFORE UPDATE ON public.seat_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_seat_templates_motorcycle_id ON public.seat_templates(motorcycle_id);
CREATE INDEX idx_seat_templates_active ON public.seat_templates(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLA: template_zones (zonas editables dentro de una plantilla)
-- ============================================================

CREATE TABLE public.template_zones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id   UUID NOT NULL REFERENCES public.seat_templates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  path_id       TEXT NOT NULL,
  default_color TEXT CHECK (default_color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_template_zones_template_id ON public.template_zones(template_id);

-- ============================================================
-- TABLA: order_designs (estado del diseñador Fabric.js)
-- ============================================================

CREATE TABLE public.order_designs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.seat_templates(id) ON DELETE SET NULL,
  fabric_json JSONB NOT NULL DEFAULT '{}',
  svg_content TEXT,
  preview_url TEXT,
  version     INTEGER NOT NULL DEFAULT 1,
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER order_designs_updated_at
  BEFORE UPDATE ON public.order_designs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_order_designs_order_id ON public.order_designs(order_id);
CREATE INDEX idx_order_designs_updated_at ON public.order_designs(updated_at DESC);

-- Autoincremento de versión al actualizar fabric_json
CREATE OR REPLACE FUNCTION increment_design_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.fabric_json IS DISTINCT FROM NEW.fabric_json THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_design_updated
  BEFORE UPDATE ON public.order_designs
  FOR EACH ROW EXECUTE FUNCTION increment_design_version();

-- ============================================================
-- TABLA: files (uploads de imágenes y logos)
-- ============================================================

CREATE TABLE public.files (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        file_type NOT NULL DEFAULT 'other',
  size        INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_order_id ON public.files(order_id);

-- ============================================================
-- TABLA: notifications (notificaciones en tiempo real)
-- ============================================================

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Trigger: notificar a todos los usuarios de rol 'admin' cuando cambia estado de un pedido
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_serial TEXT;
  v_status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT serial INTO v_serial FROM public.orders WHERE id = NEW.id;

    v_status_label := CASE NEW.status
      WHEN 'received'   THEN 'Recibido'
      WHEN 'designing'  THEN 'Diseñando'
      WHEN 'production' THEN 'Producción'
      WHEN 'sewing'     THEN 'Cosiendo'
      WHEN 'finished'   THEN 'Terminado'
      WHEN 'delivered'  THEN 'Entregado'
      ELSE NEW.status::TEXT
    END;

    INSERT INTO public.notifications (user_id, title, message, order_id)
    SELECT u.id,
           'Pedido #' || v_serial || ' actualizado',
           'Nuevo estado: ' || v_status_label,
           NEW.id
    FROM public.users u
    WHERE u.role IN ('admin', 'designer')
      AND u.id != NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_notify
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_on_status_change();

-- ============================================================
-- FUNCIONES DE NEGOCIO
-- ============================================================

-- Obtener pedido por serial + token (acceso público sin auth)
CREATE OR REPLACE FUNCTION public.get_order_by_serial(
  p_serial TEXT,
  p_token  TEXT
)
RETURNS TABLE (
  id                UUID,
  serial            TEXT,
  status            order_status,
  work_type         work_type,
  delivery_date     DATE,
  notes             TEXT,
  motorcycle_custom TEXT,
  total_price       NUMERIC,
  deposit           NUMERIC,
  balance           NUMERIC,
  client_name       TEXT,
  motorcycle_label  TEXT,
  preview_url       TEXT,
  created_at        TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.serial,
    o.status,
    o.work_type,
    o.delivery_date,
    o.notes,
    o.motorcycle_custom,
    o.total_price,
    o.deposit,
    o.balance,
    c.name AS client_name,
    COALESCE(m.brand || ' ' || m.model, o.motorcycle_custom) AS motorcycle_label,
    od.preview_url,
    o.created_at
  FROM public.orders o
  JOIN public.clients c ON c.id = o.client_id
  LEFT JOIN public.motorcycles m ON m.id = o.motorcycle_id
  LEFT JOIN public.order_designs od ON od.order_id = o.id
  WHERE o.serial = p_serial
    AND o.public_token = p_token
    AND o.deleted_at IS NULL
  ORDER BY od.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'activeOrders',       COUNT(*) FILTER (WHERE status NOT IN ('delivered') AND deleted_at IS NULL),
    'deliveriesToday',    COUNT(*) FILTER (WHERE delivery_date = CURRENT_DATE AND deleted_at IS NULL),
    'overdueOrders',      COUNT(*) FILTER (WHERE delivery_date < CURRENT_DATE AND status NOT IN ('delivered', 'finished') AND deleted_at IS NULL),
    'weeklyProduction',   COUNT(*) FILTER (WHERE status IN ('finished', 'delivered') AND updated_at >= DATE_TRUNC('week', NOW()) AND deleted_at IS NULL),
    'weeklyRevenue',      COALESCE(SUM(total_price) FILTER (WHERE status IN ('finished', 'delivered') AND updated_at >= DATE_TRUNC('week', NOW()) AND deleted_at IS NULL), 0)
  ) INTO v_result
  FROM public.orders;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embroideries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- users ----
CREATE POLICY "users: ver propio perfil" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users: admin ve todos" ON public.users
  FOR SELECT USING (auth.user_role() = 'admin');

CREATE POLICY "users: actualizar propio perfil" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users: admin gestiona todos" ON public.users
  FOR ALL USING (auth.user_role() = 'admin');

-- ---- clients ----
CREATE POLICY "clients: autenticados leen" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "clients: admin y designer escriben" ON public.clients
  FOR INSERT WITH CHECK (auth.user_role() IN ('admin', 'designer'));

CREATE POLICY "clients: admin y designer actualizan" ON public.clients
  FOR UPDATE USING (auth.user_role() IN ('admin', 'designer'));

CREATE POLICY "clients: solo admin elimina (soft)" ON public.clients
  FOR UPDATE USING (auth.user_role() = 'admin');

-- ---- motorcycles ----
CREATE POLICY "motorcycles: autenticados leen activas" ON public.motorcycles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "motorcycles: admin escribe" ON public.motorcycles
  FOR ALL USING (auth.user_role() = 'admin');

-- ---- materials ----
CREATE POLICY "materials: autenticados leen activos" ON public.materials
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "materials: admin gestiona" ON public.materials
  FOR ALL USING (auth.user_role() = 'admin');

-- ---- embroideries ----
CREATE POLICY "embroideries: autenticados leen activos" ON public.embroideries
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "embroideries: admin gestiona" ON public.embroideries
  FOR ALL USING (auth.user_role() = 'admin');

-- ---- orders ----
CREATE POLICY "orders: admin ve todos" ON public.orders
  FOR SELECT USING (auth.user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "orders: designer y produccion ven activos" ON public.orders
  FOR SELECT USING (
    auth.user_role() IN ('designer', 'production')
    AND deleted_at IS NULL
  );

CREATE POLICY "orders: admin y designer crean" ON public.orders
  FOR INSERT WITH CHECK (auth.user_role() IN ('admin', 'designer'));

CREATE POLICY "orders: admin y designer actualizan" ON public.orders
  FOR UPDATE USING (auth.user_role() IN ('admin', 'designer'));

CREATE POLICY "orders: produccion actualiza solo estado" ON public.orders
  FOR UPDATE USING (auth.user_role() = 'production');

CREATE POLICY "orders: admin elimina (soft)" ON public.orders
  FOR UPDATE USING (auth.user_role() = 'admin');

-- ---- order_status_history ----
CREATE POLICY "order_status_history: autenticados leen" ON public.order_status_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_status_history: autenticados insertan" ON public.order_status_history
  FOR INSERT WITH CHECK (auth.user_role() IN ('admin', 'designer', 'production'));

-- ---- seat_templates ----
CREATE POLICY "seat_templates: autenticados leen activas" ON public.seat_templates
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "seat_templates: admin y designer escriben" ON public.seat_templates
  FOR ALL USING (auth.user_role() IN ('admin', 'designer'));

-- ---- template_zones ----
CREATE POLICY "template_zones: autenticados leen" ON public.template_zones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "template_zones: admin y designer escriben" ON public.template_zones
  FOR ALL USING (auth.user_role() IN ('admin', 'designer'));

-- ---- order_designs ----
CREATE POLICY "order_designs: admin ve todos" ON public.order_designs
  FOR SELECT USING (auth.user_role() = 'admin');

CREATE POLICY "order_designs: designer ve y edita" ON public.order_designs
  FOR ALL USING (auth.user_role() IN ('admin', 'designer'));

CREATE POLICY "order_designs: produccion lee" ON public.order_designs
  FOR SELECT USING (auth.user_role() = 'production');

-- ---- files ----
CREATE POLICY "files: autenticados leen" ON public.files
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "files: autenticados suben" ON public.files
  FOR INSERT WITH CHECK (auth.user_role() IN ('admin', 'designer'));

CREATE POLICY "files: admin elimina" ON public.files
  FOR DELETE USING (auth.user_role() = 'admin');

-- ---- notifications ----
CREATE POLICY "notifications: ver propias" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications: marcar leidas" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- REALTIME: habilitar publicaciones
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_designs;

-- ============================================================
-- STORAGE: crear buckets
-- (ejecutar en Supabase Dashboard → Storage, o via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('order-files', 'order-files', false),
--   ('templates', 'templates', true),
--   ('avatars', 'avatars', true);
-- ============================================================
