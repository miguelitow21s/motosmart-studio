-- ============================================================
-- MotoSmart Studio — Seed Data
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- MOTOS (modelos comunes en Colombia)
-- ============================================================

INSERT INTO public.motorcycles (brand, model, displacement, notes) VALUES
  -- Yamaha
  ('Yamaha', 'DT 175',       '175cc', 'Clásica enduro - sillín largo característico'),
  ('Yamaha', 'FZ 150',       '150cc', 'Naked sport popular'),
  ('Yamaha', 'FZ 250',       '250cc', 'Versión mejorada FZ'),
  ('Yamaha', 'YBR 125',      '125cc', 'Commuter básica'),
  ('Yamaha', 'SZ 150',       '150cc', 'Retro sport'),
  ('Yamaha', 'Crypton 115',  '115cc', 'Scooter/underbone'),
  -- Honda
  ('Honda',  'XR 190',       '190cc', 'Enduro/trail popular en campo'),
  ('Honda',  'CB 190R',      '190cc', 'Naked sport'),
  ('Honda',  'CB 125F',      '125cc', 'Commuter'),
  ('Honda',  'AKT TT 125',   '125cc', 'Todoterreno liviano'),
  ('Honda',  'CBF 150',      '150cc', 'Sport commuter'),
  -- Bajaj
  ('Bajaj',  'Pulsar NS 200', '200cc', 'Naked sport - doble disco'),
  ('Bajaj',  'Pulsar 200 RS', '200cc', 'Full fairing sport'),
  ('Bajaj',  'Pulsar 150',    '150cc', 'Sport clásica'),
  ('Bajaj',  'Boxer 150',     '150cc', 'Trabajo/carga - muy común'),
  ('Bajaj',  'Discover 125',  '125cc', 'Commuter familiar'),
  -- AKT
  ('AKT',    'NKD 125',       '125cc', 'Naked deportiva económica'),
  ('AKT',    'TTR 200',       '200cc', 'Trail'),
  ('AKT',    'Dynamic 125',   '125cc', 'Street'),
  -- Suzuki
  ('Suzuki', 'GN 125',        '125cc', 'Clásica urbana'),
  ('Suzuki', 'GS 150',        '150cc', 'Retro naked'),
  ('Suzuki', 'Gixxer 155',    '155cc', 'Sport naked'),
  -- KTM
  ('KTM',    'Duke 200',      '200cc', 'Naked premium'),
  ('KTM',    'Duke 390',      '390cc', 'Naked premium alto rendimiento'),
  -- Royal Enfield
  ('Royal Enfield', 'Meteor 350', '350cc', 'Cruiser retro'),
  ('Royal Enfield', 'Classic 350', '350cc', 'Cruiser clásico'),
  -- Otros
  ('Auteco', 'Avispón 100',   '100cc', 'Moto de trabajo básica'),
  ('Loncin',  'LX 200',       '200cc', 'Enduro económica');

-- ============================================================
-- MATERIALES
-- ============================================================

INSERT INTO public.materials (name, type, color_hex) VALUES
  -- Vinilos
  ('Vinilo Negro Mate',      'vinyl',    '#1a1a1a'),
  ('Vinilo Negro Brillante', 'vinyl',    '#000000'),
  ('Vinilo Rojo Racing',     'vinyl',    '#cc0000'),
  ('Vinilo Azul Cobalto',    'vinyl',    '#003580'),
  ('Vinilo Azul Eléctrico',  'vinyl',    '#0047AB'),
  ('Vinilo Blanco Perla',    'vinyl',    '#F8F8F0'),
  ('Vinilo Gris Titanio',    'vinyl',    '#878787'),
  ('Vinilo Verde Militante', 'vinyl',    '#4B5320'),
  ('Vinilo Naranja Sport',   'vinyl',    '#FF6600'),
  ('Vinilo Amarillo Fluo',   'vinyl',    '#FFFF00'),
  ('Vinilo Carbon Fibra',    'vinyl',    '#2C2C2C'),
  ('Vinilo Morado',          'vinyl',    '#800080'),
  ('Vinilo Dorado',          'vinyl',    '#FFD700'),
  ('Vinilo Plateado',        'vinyl',    '#C0C0C0'),
  -- Cueros
  ('Cuero Negro Premium',    'leather',  '#0D0D0D'),
  ('Cuero Café Vintage',     'leather',  '#6B3A2A'),
  ('Cuero Marrón Clásico',   'leather',  '#8B4513'),
  ('Cuero Blanco Ivory',     'leather',  '#FFFFF0'),
  ('Cuero Rojo Vino',        'leather',  '#722F37'),
  -- Neopreno
  ('Neopreno Negro',         'neoprene', '#1C1C1C'),
  ('Neopreno Gris Oscuro',   'neoprene', '#404040'),
  ('Neopreno Azul Mar',      'neoprene', '#1B6CA8'),
  -- Telas especiales
  ('Tela Anti-deslizante',   'fabric',   '#2D2D2D'),
  ('Tela Malla Ventilada',   'fabric',   '#3A3A3A'),
  ('Tela Carbono Tejido',    'fabric',   '#1A1A1A');

-- ============================================================
-- BORDADOS (catálogo base)
-- ============================================================

INSERT INTO public.embroideries (name, description, price) VALUES
  ('Nombre personalizado',    'Bordado del nombre del cliente en cualquier fuente', 25000),
  ('Logo moto (marca)',       'Logo oficial de la marca de la moto bordado',        35000),
  ('Escudo/Logo personalizado','Logo traído por el cliente, bordado a color',       45000),
  ('Número de competencia',   'Número grande estilo racing en el respaldo',        20000),
  ('Bandera Colombia',        'Bandera nacional bordada',                          30000),
  ('Calavera/Skull',          'Diseño calavera estilo biker',                      40000),
  ('Flamas/Llamas',           'Diseño de llamas laterales',                        35000),
  ('Águila',                  'Águila extendida central',                           45000),
  ('Cruz celta',              'Cruz celta con detalle tribal',                      35000),
  ('Texto curvo',             'Texto en arco o curva alrededor del sillín',        30000),
  ('Tribal custom',           'Diseño tribal personalizado',                       50000),
  ('Sin bordado',             'Solo tapizado, sin bordado',                             0);

-- ============================================================
-- NOTA SOBRE EL USUARIO ADMIN
-- ============================================================
-- El usuario admin se crea en Supabase Authentication:
--   1. Ve a Authentication → Users → Add user
--   2. Email: admin@motosmart.app
--   3. Password: (elige uno seguro)
--   4. En raw_user_meta_data pon: {"full_name": "Administrador", "role": "admin"}
--
-- O ejecuta esto DESPUÉS de crear el usuario en auth:
--
-- UPDATE public.users
-- SET full_name = 'Administrador', role = 'admin'
-- WHERE email = 'admin@motosmart.app';
-- ============================================================

-- ============================================================
-- STORAGE POLICIES (ejecutar en SQL editor de Supabase)
-- ============================================================

-- Crear buckets (si no se crearon por Dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('order-files', 'order-files', false, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('templates',   'templates',   true,  5242880,
   ARRAY['image/svg+xml', 'image/png', 'application/json']),
  ('avatars',     'avatars',     true,  2097152,
   ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policies para bucket order-files (privado)
CREATE POLICY "order-files: autenticados suben"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-files');

CREATE POLICY "order-files: autenticados leen"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'order-files');

CREATE POLICY "order-files: admin elimina"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'order-files'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Policies para bucket templates (público)
CREATE POLICY "templates: lectura pública"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'templates');

CREATE POLICY "templates: admin y designer suben"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'templates'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'designer')
  );

-- Policies para bucket avatars (público)
CREATE POLICY "avatars: lectura pública"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: usuarios suben su propio avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
