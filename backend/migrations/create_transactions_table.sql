-- Crear tabla transactions para almacenar remesas
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  amount_sent DECIMAL(10, 2) NOT NULL,
  currency_sent TEXT NOT NULL,
  amount_received DECIMAL(10, 2) NOT NULL,
  currency_received TEXT NOT NULL,
  fee DECIMAL(10, 2) NOT NULL,
  from_country_code TEXT NOT NULL,
  to_country_code TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_bank TEXT NOT NULL,
  recipient_account TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias transacciones
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias transacciones
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Solo el backend (service role) puede actualizar transacciones
-- (Esta política se aplica automáticamente cuando se usa el service role key)
