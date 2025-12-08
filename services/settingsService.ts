import { supabase } from '../supabaseClient';
import { MARGEN_EXCHANGE } from '../constants';

export interface SystemSettings {
    margen_exchange: number;
    remittance_fee_percentage?: number;
}

/**
 * Obtiene el valor de una configuración específica por su clave.
 * Si no encuentra la configuración o hay error, retorna el valor por defecto.
 */
export async function getSettingNumber(key: string, defaultValue: number): Promise<number> {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) {
            console.warn(`Configuración ${key} no encontrada, usando valor por defecto: ${defaultValue}`);
            return defaultValue;
        }

        const value = parseFloat(data.value);
        return isNaN(value) ? defaultValue : value;
    } catch (err) {
        console.error(`Error obteniendo configuración ${key}:`, err);
        return defaultValue;
    }
}

/**
 * Carga todas las configuraciones críticas del sistema de una sola vez.
 */
export async function loadSystemSettings(): Promise<SystemSettings> {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('key, value');

        if (error) throw error;

        const settings: any = {};
        data?.forEach(item => {
            settings[item.key.toLowerCase()] = item.value;
        });

        return {
            margen_exchange: parseFloat(settings['margen_exchange']) || MARGEN_EXCHANGE,
            remittance_fee_percentage: parseFloat(settings['remittance_fee_percentage']) || undefined
        };
    } catch (err) {
        console.error('Error cargando configuraciones del sistema:', err);
        return {
            margen_exchange: MARGEN_EXCHANGE
        };
    }
}
