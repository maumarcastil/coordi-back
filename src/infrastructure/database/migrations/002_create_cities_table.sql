-- Crear tabla de ciudades
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas por código
CREATE INDEX IF NOT EXISTS idx_cities_code ON cities(code);

-- Crear índice para ciudades activas
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active) WHERE is_active = true;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Seed de ciudades principales de Colombia
INSERT INTO cities (name, department, code) VALUES
    ('Bogotá', 'Cundinamarca', 'BOG'),
    ('Medellín', 'Antioquia', 'MED'),
    ('Cali', 'Valle del Cauca', 'CLO'),
    ('Barranquilla', 'Atlántico', 'BAQ'),
    ('Cartagena', 'Bolívar', 'CTG');

