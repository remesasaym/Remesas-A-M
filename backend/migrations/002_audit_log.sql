-- ============================================
-- Tabla de Auditoría para tracking de cambios
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Información de la acción
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- Usuario que realizó la acción
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  
  -- Datos antes y después del cambio
  old_data jsonb,
  new_data jsonb,
  
  -- Metadata adicional
  ip_address inet,
  user_agent text,
  
  -- Índices para búsqueda rápida
  CONSTRAINT audit_log_table_name_idx CHECK (table_name IN ('transactions', 'verification_requests', 'profiles', 'beneficiaries'))
);

-- 2. Crear índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_table_name_idx ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS audit_log_operation_idx ON public.audit_log(operation);

-- 3. Habilitar RLS (solo admins pueden ver logs)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Política: Solo admins pueden ver audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_log;
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_log
  FOR SELECT
  USING (
    auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
    OR auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  );

-- 5. Función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si hay un usuario autenticado
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_log (
      table_name,
      operation,
      user_id,
      user_email,
      old_data,
      new_data
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      auth.jwt() ->> 'email',
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear triggers para tablas críticas

-- Transactions
DROP TRIGGER IF EXISTS audit_transactions_trigger ON public.transactions;
CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Verification Requests
DROP TRIGGER IF EXISTS audit_verification_requests_trigger ON public.verification_requests;
CREATE TRIGGER audit_verification_requests_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Profiles (solo UPDATE, no INSERT/DELETE)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Verificar que los triggers se crearon correctamente
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'audit_%';
