// Books, contact and newsletter: the same Supabase tables and web API routes
// the website's /books, /contact and /newsletter pages use.
import { API_URL } from './config';

// A row of the `books` table (the website's Book, plus the detail page's extra fields)
export interface Book {
  id: number;
  title_en: string;
  title_te: string;
  author_en: string;
  author_te: string;
  description_en: string | null;
  description_te: string | null;
  category: string;
  price: number;
  currency: string | null;
  rating: number | null;
  reviews_count: number | null;
  stock_quantity: number | null;
  bestseller: boolean;
  featured: boolean;
  cover_emoji: string | null;
  cover_image_url?: string | null;
  isbn?: string | null;
  pages?: number | null;
  publication_year?: number | null;
  publisher_en?: string | null;
  publisher_te?: string | null;
}

// Covers stored as site paths (e.g. /books/foo.jpg) are served by the website
export function coverUrl(url?: string | null) {
  if (!url) return '';
  if (/^(https?:|data:)/i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const rupeesIN = (n: number | string) => `₹${Number(n).toLocaleString('en-IN')}`;

// POST JSON to the web app. res is null on a network error; data is {} when the body is not JSON.
async function postJson(path: string, body: unknown): Promise<{ res: Response | null; data: Record<string, any> | null }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res) return { res: null, data: null };
  const data = await res.json().catch(() => null);
  return { res, data };
}

export interface BookBuyer {
  name: string;
  email: string;
  phone: string;
}

// The server sets the amount and the order notes from the books table
export async function createBookOrder(bookId: number, buyer: BookBuyer) {
  const { res, data } = await postJson('/api/razorpay/create-order', {
    payment_type: 'book',
    book_id: bookId,
    payer_name: buyer.name,
    payer_email: buyer.email,
    payer_phone: buyer.phone,
  });
  const orderData = res ? data ?? { error: 'Could not start payment' } : { error: 'Network error, please try again' };
  if (!res || !res.ok) throw new Error(orderData.error || 'Could not start payment');
  return orderData as { order: { id: string; amount: number; currency?: string } };
}

// The server checks the signature with Razorpay, saves the order and emails the receipt
export async function verifyBookPayment(payment: { order_id: string; payment_id: string; signature: string }) {
  const { res, data } = await postJson('/api/razorpay/verify-payment', {
    order_id: payment.order_id,
    payment_id: payment.payment_id,
    signature: payment.signature,
  });
  if (!res) throw new Error('Network request failed');
  const verifyData = data ?? {};
  if (!res.ok || !verifyData.verified) {
    throw new Error(verifyData.details || verifyData.error || 'Payment verification failed');
  }
  return verifyData as { verified: true; receipt_number?: string | null; receipt_emailed?: boolean };
}

// Reactivates an email that is on the newsletter list (true when it worked)
export async function resubscribeNewsletter(email: string) {
  const { res } = await postJson('/api/newsletter/resubscribe', { email });
  return !!res?.ok;
}

export async function unsubscribeNewsletter(email: string) {
  const { res, data } = await postJson('/api/newsletter/unsubscribe', { email });
  if (!res) throw new Error('failed');
  return { ok: res.ok, data: (data ?? {}) as { already?: boolean; error?: string } };
}
