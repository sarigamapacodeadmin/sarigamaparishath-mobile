// Calls to the web app's API routes. The app reuses them so phone login,
// payments and receipts behave exactly as on the website.
import { API_URL } from './config';
import { supabase } from './supabase';
import type { Activity, Member } from '../shared/types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public body?: Record<string, unknown>) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) };
  if (withAuth) {
    const { data } = await supabase.auth.getSession();
    headers.Authorization = `Bearer ${data.session?.access_token ?? ''}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = typeof body?.error === 'string' ? body.error : undefined;
    throw new ApiError(code || `Request failed (${res.status})`, res.status, code, body);
  }
  return body as T;
}

export function fetchActivities(category?: string) {
  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  return request<Activity[]>(`/api/activities${query}`);
}

export function fetchActivity(id: string | number) {
  return request<Activity>(`/api/activities/${encodeURIComponent(String(id))}`);
}

// Mobile-number login: the server finds the member's login and returns session tokens
export function phoneLogin(phone: string, password: string) {
  return request<{ access_token: string; refresh_token: string }>('/api/auth/phone-login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
}

export function fetchMyMember() {
  return request<Member>('/api/member/me', {}, true);
}

export function createMyMember(fields: { name: string; phone: string; city?: string; state?: string; gotra?: string }) {
  return request<Member>('/api/member/me', { method: 'POST', body: JSON.stringify(fields) }, true);
}

export function completeFirstLogin(email: string, password: string) {
  return request<{ ok: true; email: string }>('/api/member/first-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, true);
}

// Emails a one-time link to the website's /reset-password page. Same answer
// whether or not a login was found.
export function requestPasswordReset(identifier: string) {
  return request<{ ok: true }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export function changePassword(password: string) {
  return request<{ ok: true }>('/api/member/change-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }, true);
}

export interface DonorDetails {
  name: string;
  email: string;
  phone: string;
}

export function createDonationOrder(amountRupees: number, purpose: string, donor: DonorDetails) {
  return request<{ success: boolean; order: { id: string; amount: number; currency: string } }>('/api/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountRupees * 100,
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
      donor_name: donor.name,
      donor_email: donor.email,
      donor_phone: donor.phone,
      notes: { organization: 'Sanatana Parishath', type: 'Donation', purpose, channel: 'android-app' },
    }),
  });
}

export function verifyPayment(payment: { order_id: string; payment_id: string; signature: string }, amountRupees: number, purpose: string, donor: DonorDetails) {
  return request<{ verified: boolean; receipt_number: string | null; receipt_emailed: boolean }>('/api/razorpay/verify-payment', {
    method: 'POST',
    body: JSON.stringify({
      ...payment,
      donor_name: donor.name,
      donor_email: donor.email,
      donor_phone: donor.phone,
      amount: amountRupees,
      purpose,
    }),
  });
}

export interface EventRegistration {
  name: string;
  email: string;
  phone: string;
  attendees: number;
}

// Public event registration; a logged-in member's registration is linked to their login
export async function registerForEvent(eventId: string, registration: EventRegistration) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return request<{ registered_count: number; updated: boolean }>(`/api/events/${encodeURIComponent(eventId)}/register`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(registration),
  });
}
