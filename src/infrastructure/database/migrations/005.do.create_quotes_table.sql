-- Crear tabla de cotizaciones
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    destination_city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    
    -- Dimensiones del paquete
    weight DECIMAL(10,2) NOT NULL,          -- Peso real en kg
    length DECIMAL(10,2) NOT NULL,          -- Largo en cm
    width DECIMAL(10,2) NOT NULL,           -- Ancho en cm
    height DECIMAL(10,2) NOT NULL,          -- Alto en cm
    
    -- Pesos calculados
    volumetric_weight DECIMAL(10,2) NOT NULL,   -- (largo * ancho * alto) / 5000
    chargeable_weight DECIMAL(10,2) NOT NULL,   -- MAX(peso_real, peso_volumétrico)
    
    -- Precio calculado
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Estado de la cotización
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Fecha de expiración (por defecto 7 días desde la creación)
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para validar que origen y destino sean diferentes
    CONSTRAINT chk_different_cities CHECK (origin_city_id != destination_city_id),
    
    -- Constraint para validar estados permitidos
    CONSTRAINT chk_quote_status CHECK (status IN ('pending', 'converted', 'expired'))
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Índice compuesto para búsquedas frecuentes (usuario + estado)
CREATE INDEX IF NOT EXISTS idx_quotes_user_status ON quotes(user_id, status);

-- Índice para cotizaciones pendientes que no han expirado
CREATE INDEX IF NOT EXISTS idx_quotes_pending_expires 
    ON quotes(expires_at) 
    WHERE status = 'pending';

-- Índice para búsquedas por ciudad origen
CREATE INDEX IF NOT EXISTS idx_quotes_origin ON quotes(origin_city_id);

-- Índice para búsquedas por ciudad destino
CREATE INDEX IF NOT EXISTS idx_quotes_destination ON quotes(destination_city_id);

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS quotes_updated_at ON quotes;
CREATE TRIGGER quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

