import type { User as SupabaseUser } from '@supabase/supabase-js';

// Combina el usuario de Supabase Auth con nuestro perfil personalizado
export type User = SupabaseUser & {
  fullName: string;
  isVerified: boolean;
  phone?: string;
};

// FIX: Added missing Beneficiary interface.
export interface Beneficiary {
  id: string; // uuid
  created_at: string;
  user_id: string;
  name: string;
  country_code: string;
  bank: string;
  account_number: string;
  document_id: string;
}

export interface Bank {
  name: string;
  type: 'National' | 'International';
}

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  banks: Bank[];
  currency: string;
  exchangeRateToUSD: number;
  region: 'LatAm' | 'Intl' | 'Europe' | 'North America';
  minimumSendAmount: number;
}

export enum Screen {
  Calculator,
  Exchange,
  // FIX: Added missing Beneficiaries screen to enum.
  Beneficiaries,
  History,
  Profile,
  Info,
  Admin, // Nuevo: Pantalla para el panel de administración
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Transaction {
  id: string; // ID interno de Supabase (uuid)
  created_at: string;
  transaction_id: string; // ID de referencia de la transacción para el usuario
  amount_sent: number;
  currency_sent: string;
  amount_received: number;
  currency_received: string;
  // Añadimos los campos que el backend está guardando y retornando
  recipient_name: string;
  recipient_bank: string;
  recipient_account: string;
  recipient_id: string;
  fee: number; // La comisión aplicada
  status: 'Completado' | 'Pendiente' | 'Fallido';
  from_country_code: string;
  to_country_code: string;
  processed_by?: string; // ID del usuario que procesó (aprobó) la transacción
  processed_at?: string; // Marca de tiempo de cuándo fue procesada
  user_id: string;
  receipt_url?: string; // URL del comprobante de pago subido por el usuario
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
  updated_by?: string;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  message: string;
  is_read: boolean;
  type?: string; // Ej: 'transaction_approved'
  transaction_id?: string; // Referencia a la transacción relacionada
}
