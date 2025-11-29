-- ============================================
-- Índices de Optimización para Performance
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- TRANSACTIONS
-- ============================================

-- Índice para búsqueda por usuario (usado en historial)
CREATE INDEX IF NOT EXISTS transactions_user_id_created_at_idx 
  ON public.transactions(user_id, created_at DESC);

-- Índice para búsqueda por transaction_id (usado en webhooks)
CREATE INDEX IF NOT EXISTS transactions_transaction_id_idx 
  ON public.transactions(transaction_id);

-- Índice para búsqueda por status (usado en admin panel)
CREATE INDEX IF NOT EXISTS transactions_status_idx 
  ON public.transactions(status);

-- Índice compuesto para queries de admin (status + fecha)
CREATE INDEX IF NOT EXISTS transactions_status_created_at_idx 
  ON public.transactions(status, created_at DESC);

-- Índice para búsqueda por país de origen/destino
CREATE INDEX IF NOT EXISTS transactions_countries_idx 
  ON public.transactions(from_country_code, to_country_code);

-- ============================================
-- VERIFICATION_REQUESTS
-- ============================================

-- Índice para búsqueda por usuario
CREATE INDEX IF NOT EXISTS verification_requests_user_id_idx 
  ON public.verification_requests(user_id);

-- Índice para búsqueda por status (usado en admin panel)
CREATE INDEX IF NOT EXISTS verification_requests_status_idx 
  ON public.verification_requests(status);

-- Índice compuesto para queries de admin
CREATE INDEX IF NOT EXISTS verification_requests_status_created_at_idx 
  ON public.verification_requests(status, created_at DESC);

-- Índice para búsqueda por confianza de IA (para análisis)
CREATE INDEX IF NOT EXISTS verification_requests_ai_confidence_idx 
  ON public.verification_requests(ai_confidence DESC)
  WHERE ai_confidence IS NOT NULL;

-- Índice para verificaciones que requieren revisión manual
CREATE INDEX IF NOT EXISTS verification_requests_manual_review_idx 
  ON public.verification_requests(requires_manual_review, created_at DESC)
  WHERE requires_manual_review = true;

-- ============================================
-- BENEFICIARIES
-- ============================================

-- Índice para búsqueda por usuario (ya existe UNIQUE en user_id + account_number)
CREATE INDEX IF NOT EXISTS beneficiaries_user_id_created_at_idx 
  ON public.beneficiaries(user_id, created_at DESC);

-- Índice para búsqueda por país
CREATE INDEX IF NOT EXISTS beneficiaries_country_code_idx 
  ON public.beneficiaries(country_code);

-- ============================================
-- PROFILES
-- ============================================

-- Índice para búsqueda por email (útil para admin)
CREATE INDEX IF NOT EXISTS profiles_email_idx 
  ON public.profiles(email);

-- Índice para usuarios verificados
CREATE INDEX IF NOT EXISTS profiles_is_verified_idx 
  ON public.profiles(is_verified)
  WHERE is_verified = true;

-- Índice para búsqueda por nombre completo (para admin search)
CREATE INDEX IF NOT EXISTS profiles_full_name_idx 
  ON public.profiles USING gin(to_tsvector('spanish', full_name));

-- ============================================
-- ANÁLISIS DE PERFORMANCE
-- ============================================

-- Ver tamaño de tablas e índices
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver índices no utilizados (ejecutar después de 1 semana en producción)
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Estadísticas de uso de índices
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
