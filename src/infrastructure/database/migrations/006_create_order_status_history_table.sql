-- Crear tabla de historial de estados de órdenes
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencia a la orden (UUID)
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Estado registrado
    status VARCHAR(20) NOT NULL,
    
    -- Información adicional del cambio de estado
    notes TEXT,
    location VARCHAR(200),
    
    -- Quién realizó el cambio (puede ser sistema o usuario)
    changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_by_system BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para validar estados permitidos
    CONSTRAINT chk_history_status CHECK (
        status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')
    )
);

-- Índice para búsquedas por orden
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_status_history(order_id);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_order_history_status ON order_status_history(status);

-- Índice compuesto para obtener historial ordenado por fecha (descendente)
CREATE INDEX IF NOT EXISTS idx_order_history_order_created ON order_status_history(order_id, created_at DESC);

-- Índice para búsquedas por usuario que realizó el cambio
CREATE INDEX IF NOT EXISTS idx_order_history_changed_by ON order_status_history(changed_by_user_id);

