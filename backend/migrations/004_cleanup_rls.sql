-- ============================================
-- Limpieza de políticas duplicadas y agregar faltantes
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar políticas duplicadas
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

-- 2. Agregar política para prevenir UPDATE por usuarios normales
-- (solo admins pueden actualizar)
DROP POLICY IF EXISTS "Users cannot update transactions" ON public.transactions;
CREATE POLICY "Users cannot update transactions"
  ON public.transactions
  FOR UPDATE
  USING (false); -- Nadie excepto service_role puede actualizar

-- 3. Agregar política para prevenir DELETE por usuarios normales
DROP POLICY IF EXISTS "Users cannot delete transactions" ON public.transactions;
CREATE POLICY "Users cannot delete transactions"
  ON public.transactions
  FOR DELETE
  USING (false); -- Nadie excepto service_role puede eliminar

-- 4. Verificar políticas finales
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as condition
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY cmd, policyname;

-- Resultado esperado: 6 políticas
-- SELECT: Users can view own transactions, Admin can view all transactions
-- INSERT: Users can insert own transactions
-- UPDATE: Admin can update any transaction, Users cannot update transactions
-- DELETE: Users cannot delete transactions
