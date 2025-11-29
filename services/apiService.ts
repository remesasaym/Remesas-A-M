
import { supabase } from "../supabaseClient";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session found");
  }
  return {
    "Authorization": `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function sendRemittance(remittanceData: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/remittances/send`, {
    method: "POST",
    headers,
    body: JSON.stringify(remittanceData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to send remittance");
  }

  return response.json();
}

export async function getHistory() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session found");
  }
  const headers = {
    "Authorization": `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(`${API_URL}/remittances/history?userId=${session.user.id}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch history");
  }

  return response.json();
}
