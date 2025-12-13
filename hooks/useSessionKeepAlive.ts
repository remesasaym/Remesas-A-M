import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

/**
 * Hook to keep the user session alive by refreshing the token periodically
 * and handling session expiration gracefully
 */
export function useSessionKeepAlive() {
    useEffect(() => {
        // Refresh session every 30 minutes (1800000 ms)
        const refreshInterval = setInterval(async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                // Attempt to refresh the session
                const { error: refreshError } = await supabase.auth.refreshSession();

                if (refreshError) {
                    console.error('Error refreshing session:', refreshError);
                    toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    // Optionally, you could redirect to login here
                    // await supabase.auth.signOut();
                } else {
                    console.log('Session refreshed successfully');
                }
            }
        }, 30 * 60 * 1000); // 30 minutes

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED') {
                console.log('Token was refreshed');
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
            } else if (event === 'USER_UPDATED') {
                console.log('User updated');
            }
        });

        // Cleanup
        return () => {
            clearInterval(refreshInterval);
            subscription.unsubscribe();
        };
    }, []);
}
