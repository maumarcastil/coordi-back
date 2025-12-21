-- Crear tabla de órdenes de envío
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencias a tablas existentes (mantienen INTEGER)
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    destination_city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    
    -- Datos heredados de la cotización (desnormalizados para histórico)
    weight DECIMAL(10,2) NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    volumetric_weight DECIMAL(10,2) NOT NULL,
    chargeable_weight DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Tracking y estado
    tracking_number VARCHAR(50) UNIQUE,
    current_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Información del remitente
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    sender_address TEXT NOT NULL,
    
    -- Información del destinatario
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_address TEXT NOT NULL,
    
    -- Descripción del paquete
    package_description TEXT,
    
    -- Fechas importantes
    estimated_delivery_date DATE,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para validar estados permitidos
    CONSTRAINT chk_order_status CHECK (
        current_status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')
    )
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Índice para búsquedas por cotización (unique implícito por lógica de negocio)
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);

-- Índice para búsquedas por tracking number (ya es UNIQUE, pero explícito para claridad)
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(current_status);

-- Índice compuesto para búsquedas frecuentes (usuario + estado)
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, current_status);

-- Índice para búsquedas por ciudad origen
CREATE INDEX IF NOT EXISTS idx_orders_origin ON orders(origin_city_id);

-- Índice para búsquedas por ciudad destino
CREATE INDEX IF NOT EXISTS idx_orders_destination ON orders(destination_city_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

