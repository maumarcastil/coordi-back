-- Crear tabla de tarifas de envío
-- Las tarifas son simétricas: city_a_id siempre es menor que city_b_id
CREATE TABLE IF NOT EXISTS shipping_rates (
    id SERIAL PRIMARY KEY,
    city_a_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    city_b_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    base_price DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    distance_km INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para asegurar que city_a_id < city_b_id (tarifas simétricas)
    CONSTRAINT chk_city_order CHECK (city_a_id < city_b_id),
    
    -- Constraint único para evitar duplicados de rutas
    CONSTRAINT uq_shipping_rate_cities UNIQUE (city_a_id, city_b_id)
);

-- Índice para búsquedas por ciudad A
CREATE INDEX IF NOT EXISTS idx_shipping_rates_city_a ON shipping_rates(city_a_id);

-- Índice para búsquedas por ciudad B
CREATE INDEX IF NOT EXISTS idx_shipping_rates_city_b ON shipping_rates(city_b_id);

-- Índice para tarifas activas
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(is_active) WHERE is_active = true;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER shipping_rates_updated_at
    BEFORE UPDATE ON shipping_rates
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Seed de tarifas para TODAS las combinaciones de ciudades
-- IDs: 1: Bogotá, 2: Medellín, 3: Cali, 4: Barranquilla, 5: Cartagena
-- Total: 10 combinaciones (5 ciudades = 5*4/2 = 10 pares)

INSERT INTO shipping_rates (city_a_id, city_b_id, base_price, price_per_kg, distance_km) VALUES
    -- Bogotá (1) con todas las demás
    (1, 2, 15000.00, 2500.00, 415),   -- Bogotá - Medellín
    (1, 3, 18000.00, 2800.00, 460),   -- Bogotá - Cali
    (1, 4, 25000.00, 3200.00, 1000),  -- Bogotá - Barranquilla
    (1, 5, 26000.00, 3300.00, 1040),  -- Bogotá - Cartagena
    
    -- Medellín (2) con las restantes
    (2, 3, 14000.00, 2400.00, 415),   -- Medellín - Cali
    (2, 4, 18000.00, 2800.00, 700),   -- Medellín - Barranquilla
    (2, 5, 19000.00, 2900.00, 640),   -- Medellín - Cartagena
    
    -- Cali (3) con las restantes
    (3, 4, 22000.00, 3000.00, 950),   -- Cali - Barranquilla
    (3, 5, 23000.00, 3100.00, 990),   -- Cali - Cartagena
    
    -- Barranquilla (4) con Cartagena (5)
    (4, 5, 5000.00, 1200.00, 130);    -- Barranquilla - Cartagena

