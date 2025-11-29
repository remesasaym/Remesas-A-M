-- ============================================
-- Políticas RLS para tabla transactions
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar RLS en transactions (si no está habilitado)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Política para que usuarios vean solo sus propias transacciones
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Política para que usuarios solo puedan insertar sus propias transacciones
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Política para que usuarios NO puedan actualizar transacciones
-- (solo el backend con service_role_key puede hacerlo)
DROP POLICY IF EXISTS "Users cannot update transactions" ON public.transactions;
CREATE POLICY "Users cannot update transactions"
  ON public.transactions
  FOR UPDATE
  USING (false);

-- 5. Política para que usuarios NO puedan eliminar transacciones
DROP POLICY IF EXISTS "Users cannot delete transactions" ON public.transactions;
CREATE POLICY "Users cannot delete transactions"
  ON public.transactions
  FOR DELETE
  USING (false);

-- 6. Política para admins (pueden ver todas las transacciones)
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  USING (
    auth.uid() = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda'::uuid
    OR auth.jwt() ->> 'email' = 'pineroanthony2@gmail.com'
  );

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'transactions';
