-- ============================================================
-- MotoSmart Studio — Schema Principal (Part A)
-- Ejecutar via Management API o SQL Editor
-- NO contiene referencias de escritura al schema auth
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIPOS ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'designer', 'production', 'client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'received', 'designing', 'production', 'sewing', 'finished', 'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE work_type AS ENUM (
    'cover', 'foam', 'embroidery', 'design', 'full_custom', 'repair'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE material_type AS ENUM (
    'vinyl', 'leather', 'neoprene', 'fabric', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE file_type AS ENUM (
    'logo', 'reference', 'final_photo', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- FUNCIÓN: set_updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: users
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'production',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================================
-- TABLA: clients
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_clients_name      ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_phone     ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_active    ON public.clients(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLA: motorcycles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.motorcycles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INTEGER CHECK (year >= 1950 AND year <= 2100),
  displacement  TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_motorcycles_brand_model ON public.motorcycles(brand, model);
CREATE INDEX IF NOT EXISTS idx_motorcycles_active ON public.motorcycles(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLA: materials
-- ============================================================

CREATE TABLE IF NOT EXISTS public.materials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        material_type NOT NULL,
  color_hex   TEXT CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  texture_url TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_type   ON public.materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_active ON public.materials(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLA: embroideries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.embroideries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embroideries_active ON public.embroideries(is_active) WHERE is_active = TRUE;

-- ============================================================
-- SECUENCIA: serial de pedidos
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS order_serial_seq
  START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- ============================================================
-- TABLA: orders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
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

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_serial        ON public.orders(serial);
CREATE INDEX IF NOT EXISTS idx_orders_client_id     ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_by    ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_public_token  ON public.orders(public_token);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at    ON public.orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON public.orders(created_at DESC);

-- ============================================================
-- TABLA: order_status_history
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status      order_status NOT NULL,
  notes       TEXT,
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osh_order_id   ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_osh_created_at ON public.order_status_history(created_at DESC);

CREATE OR REPLACE FUNCTION record_initial_order_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.order_status_history (order_id, status, notes, created_by)
  VALUES (NEW.id, NEW.status, 'Pedido creado', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION record_initial_order_status();

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

DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;
CREATE TRIGGER on_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION record_order_status_change();

-- ============================================================
-- TABLA: seat_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seat_templates (
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

DROP TRIGGER IF EXISTS seat_templates_updated_at ON public.seat_templates;
CREATE TRIGGER seat_templates_updated_at
  BEFORE UPDATE ON public.seat_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_seat_templates_motorcycle_id ON public.seat_templates(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_seat_templates_active ON public.seat_templates(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLA: template_zones
-- ============================================================

CREATE TABLE IF NOT EXISTS public.template_zones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id   UUID NOT NULL REFERENCES public.seat_templates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  path_id       TEXT NOT NULL,
  default_color TEXT CHECK (default_color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_template_zones_template_id ON public.template_zones(template_id);

-- ============================================================
-- TABLA: order_designs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_designs (
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

DROP TRIGGER IF EXISTS order_designs_updated_at ON public.order_designs;
CREATE TRIGGER order_designs_updated_at
  BEFORE UPDATE ON public.order_designs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_order_designs_order_id    ON public.order_designs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_designs_updated_at  ON public.order_designs(updated_at DESC);

CREATE OR REPLACE FUNCTION increment_design_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.fabric_json IS DISTINCT FROM NEW.fabric_json THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_design_updated ON public.order_designs;
CREATE TRIGGER on_design_updated
  BEFORE UPDATE ON public.order_designs
  FOR EACH ROW EXECUTE FUNCTION increment_design_version();

-- ============================================================
-- TABLA: files
-- ============================================================

CREATE TABLE IF NOT EXISTS public.files (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        file_type NOT NULL DEFAULT 'other',
  size        INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_order_id ON public.files(order_id);

-- ============================================================
-- TABLA: notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_serial TEXT;
  v_status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_serial := (SELECT serial FROM public.orders WHERE id = NEW.id);
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

DROP TRIGGER IF EXISTS on_order_status_notify ON public.orders;
CREATE TRIGGER on_order_status_notify
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_on_status_change();

-- ============================================================
-- FUNCIONES DE NEGOCIO
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_order_by_serial(p_serial TEXT, p_token TEXT)
RETURNS TABLE (
  id UUID, serial TEXT, status order_status, work_type work_type,
  delivery_date DATE, notes TEXT, motorcycle_custom TEXT,
  total_price NUMERIC, deposit NUMERIC, balance NUMERIC,
  client_name TEXT, motorcycle_label TEXT, preview_url TEXT, created_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.serial, o.status, o.work_type, o.delivery_date, o.notes,
         o.motorcycle_custom, o.total_price, o.deposit, o.balance,
         c.name, COALESCE(m.brand || ' ' || m.model, o.motorcycle_custom),
         od.preview_url, o.created_at
  FROM public.orders o
  JOIN public.clients c ON c.id = o.client_id
  LEFT JOIN public.motorcycles m ON m.id = o.motorcycle_id
  LEFT JOIN public.order_designs od ON od.order_id = o.id
  WHERE o.serial = p_serial AND o.public_token = p_token AND o.deleted_at IS NULL
  ORDER BY od.updated_at DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB SECURITY DEFINER AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'activeOrders',     COUNT(*) FILTER (WHERE status != 'delivered' AND deleted_at IS NULL),
    'deliveriesToday',  COUNT(*) FILTER (WHERE delivery_date = CURRENT_DATE AND deleted_at IS NULL),
    'overdueOrders',    COUNT(*) FILTER (WHERE delivery_date < CURRENT_DATE AND status NOT IN ('delivered','finished') AND deleted_at IS NULL),
    'weeklyProduction', COUNT(*) FILTER (WHERE status IN ('finished','delivered') AND updated_at >= DATE_TRUNC('week', NOW()) AND deleted_at IS NULL),
    'weeklyRevenue',    COALESCE(SUM(total_price) FILTER (WHERE status IN ('finished','delivered') AND updated_at >= DATE_TRUNC('week', NOW()) AND deleted_at IS NULL), 0)
  ) INTO v_result FROM public.orders;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Helper de rol para RLS (en public, no en auth)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
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

-- users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (public.current_user_role() = 'admin');
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'designer'));
DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (public.current_user_role() IN ('admin', 'designer'));

-- motorcycles
DROP POLICY IF EXISTS "motorcycles_select" ON public.motorcycles;
CREATE POLICY "motorcycles_select" ON public.motorcycles FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "motorcycles_admin" ON public.motorcycles;
CREATE POLICY "motorcycles_admin" ON public.motorcycles FOR ALL USING (public.current_user_role() = 'admin');

-- materials
DROP POLICY IF EXISTS "materials_select" ON public.materials;
CREATE POLICY "materials_select" ON public.materials FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);
DROP POLICY IF EXISTS "materials_admin" ON public.materials;
CREATE POLICY "materials_admin" ON public.materials FOR ALL USING (public.current_user_role() = 'admin');

-- embroideries
DROP POLICY IF EXISTS "embroideries_select" ON public.embroideries;
CREATE POLICY "embroideries_select" ON public.embroideries FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);
DROP POLICY IF EXISTS "embroideries_admin" ON public.embroideries;
CREATE POLICY "embroideries_admin" ON public.embroideries FOR ALL USING (public.current_user_role() = 'admin');

-- orders
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
CREATE POLICY "orders_select_admin" ON public.orders FOR SELECT USING (public.current_user_role() = 'admin' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
CREATE POLICY "orders_select_staff" ON public.orders FOR SELECT USING (public.current_user_role() IN ('designer','production') AND deleted_at IS NULL);
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (public.current_user_role() IN ('admin','designer'));
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (public.current_user_role() IN ('admin','designer','production'));

-- order_status_history
DROP POLICY IF EXISTS "osh_select" ON public.order_status_history;
CREATE POLICY "osh_select" ON public.order_status_history FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "osh_insert" ON public.order_status_history;
CREATE POLICY "osh_insert" ON public.order_status_history FOR INSERT WITH CHECK (public.current_user_role() IN ('admin','designer','production'));

-- seat_templates
DROP POLICY IF EXISTS "templates_select" ON public.seat_templates;
CREATE POLICY "templates_select" ON public.seat_templates FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);
DROP POLICY IF EXISTS "templates_write" ON public.seat_templates;
CREATE POLICY "templates_write" ON public.seat_templates FOR ALL USING (public.current_user_role() IN ('admin','designer'));

-- template_zones
DROP POLICY IF EXISTS "zones_select" ON public.template_zones;
CREATE POLICY "zones_select" ON public.template_zones FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "zones_write" ON public.template_zones;
CREATE POLICY "zones_write" ON public.template_zones FOR ALL USING (public.current_user_role() IN ('admin','designer'));

-- order_designs
DROP POLICY IF EXISTS "designs_admin" ON public.order_designs;
CREATE POLICY "designs_admin" ON public.order_designs FOR ALL USING (public.current_user_role() IN ('admin','designer'));
DROP POLICY IF EXISTS "designs_production" ON public.order_designs;
CREATE POLICY "designs_production" ON public.order_designs FOR SELECT USING (public.current_user_role() = 'production');

-- files
DROP POLICY IF EXISTS "files_select" ON public.files;
CREATE POLICY "files_select" ON public.files FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "files_insert" ON public.files;
CREATE POLICY "files_insert" ON public.files FOR INSERT WITH CHECK (public.current_user_role() IN ('admin','designer'));
DROP POLICY IF EXISTS "files_delete" ON public.files;
CREATE POLICY "files_delete" ON public.files FOR DELETE USING (public.current_user_role() = 'admin');

-- notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_designs;
