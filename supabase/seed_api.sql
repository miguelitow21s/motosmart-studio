-- Seed sin la parte de storage (que requiere permisos especiales)
-- Motos
INSERT INTO public.motorcycles (brand, model, displacement, notes) VALUES
  ('Yamaha', 'DT 175',       '175cc', 'Clásica enduro - sillín largo característico'),
  ('Yamaha', 'FZ 150',       '150cc', 'Naked sport popular'),
  ('Yamaha', 'FZ 250',       '250cc', 'Versión mejorada FZ'),
  ('Yamaha', 'YBR 125',      '125cc', 'Commuter básica'),
  ('Yamaha', 'SZ 150',       '150cc', 'Retro sport'),
  ('Yamaha', 'Crypton 115',  '115cc', 'Scooter/underbone'),
  ('Honda',  'XR 190',       '190cc', 'Enduro/trail popular en campo'),
  ('Honda',  'CB 190R',      '190cc', 'Naked sport'),
  ('Honda',  'CB 125F',      '125cc', 'Commuter'),
  ('Honda',  'CBF 150',      '150cc', 'Sport commuter'),
  ('Bajaj',  'Pulsar NS 200','200cc', 'Naked sport - doble disco'),
  ('Bajaj',  'Pulsar 200 RS','200cc', 'Full fairing sport'),
  ('Bajaj',  'Pulsar 150',   '150cc', 'Sport clásica'),
  ('Bajaj',  'Boxer 150',    '150cc', 'Trabajo/carga - muy común'),
  ('Bajaj',  'Discover 125', '125cc', 'Commuter familiar'),
  ('AKT',    'NKD 125',      '125cc', 'Naked deportiva económica'),
  ('AKT',    'TTR 200',      '200cc', 'Trail'),
  ('AKT',    'Dynamic 125',  '125cc', 'Street'),
  ('Suzuki', 'GN 125',       '125cc', 'Clásica urbana'),
  ('Suzuki', 'GS 150',       '150cc', 'Retro naked'),
  ('Suzuki', 'Gixxer 155',   '155cc', 'Sport naked'),
  ('KTM',    'Duke 200',     '200cc', 'Naked premium'),
  ('KTM',    'Duke 390',     '390cc', 'Naked premium alto rendimiento'),
  ('Royal Enfield', 'Meteor 350',  '350cc', 'Cruiser retro'),
  ('Royal Enfield', 'Classic 350', '350cc', 'Cruiser clásico'),
  ('Auteco', 'Avispón 100',  '100cc', 'Moto de trabajo básica'),
  ('Loncin',  'LX 200',      '200cc', 'Enduro económica')
ON CONFLICT DO NOTHING;

-- Materiales
INSERT INTO public.materials (name, type, color_hex) VALUES
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
  ('Cuero Negro Premium',    'leather',  '#0D0D0D'),
  ('Cuero Café Vintage',     'leather',  '#6B3A2A'),
  ('Cuero Marrón Clásico',   'leather',  '#8B4513'),
  ('Cuero Blanco Ivory',     'leather',  '#FFFFF0'),
  ('Cuero Rojo Vino',        'leather',  '#722F37'),
  ('Neopreno Negro',         'neoprene', '#1C1C1C'),
  ('Neopreno Gris Oscuro',   'neoprene', '#404040'),
  ('Neopreno Azul Mar',      'neoprene', '#1B6CA8'),
  ('Tela Anti-deslizante',   'fabric',   '#2D2D2D'),
  ('Tela Malla Ventilada',   'fabric',   '#3A3A3A'),
  ('Tela Carbono Tejido',    'fabric',   '#1A1A1A')
ON CONFLICT DO NOTHING;

-- Bordados
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
  ('Sin bordado',             'Solo tapizado, sin bordado',                             0)
ON CONFLICT DO NOTHING;
