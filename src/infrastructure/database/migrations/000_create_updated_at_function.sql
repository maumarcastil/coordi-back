-- Función reutilizable para actualizar automáticamente updated_at
-- Esta función se usará como trigger en todas las tablas que tengan el campo updated_at

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
