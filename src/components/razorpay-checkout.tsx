import { Linking, Modal, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { API_URL, RAZORPAY_KEY_ID } from '../lib/config';
import { colors } from '../lib/theme';
import { PARISHATH_NAME } from '../shared/donation-options';

// Razorpay's standard web checkout (checkout.js) inside a WebView, so payments
// work in Expo Go and need no native Razorpay SDK. The order is created and the
// payment verified by the web app's API, exactly as on the website.

export interface RazorpaySuccess {
  order_id: string;
  payment_id: string;
  signature: string;
}

interface Props {
  visible: boolean;
  orderId: string;
  amountPaise: number;
  description: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (result: RazorpaySuccess) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
}

function checkoutHtml(options: Record<string, unknown>) {
  // JSON is safe to embed except for "</script>", which is escaped here
  const json = JSON.stringify(options).replace(/</g, '\\u003c');
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;background:${colors.ivory};font-family:sans-serif;color:${colors.brand600};display:flex;align-items:center;justify-content:center;height:100vh}</style>
</head><body><p id="status">Opening Razorpay…</p>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  function send(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  try {
    var options = ${json};
    options.handler = function (r) {
      send({ type: 'success', order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature });
    };
    options.modal = { ondismiss: function () { send({ type: 'dismiss' }); } };
    // A failed attempt stays in Razorpay's window so the donor can retry; closing it sends 'dismiss'
    new Razorpay(options).open();
  } catch (e) {
    send({ type: 'failed', error: String(e && e.message || e) });
  }
</script></body></html>`;
}

export function RazorpayCheckout({ visible, orderId, amountPaise, description, prefill, onSuccess, onDismiss, onFailure }: Props) {
  const html = checkoutHtml({
    key: RAZORPAY_KEY_ID,
    order_id: orderId,
    amount: amountPaise,
    currency: 'INR',
    name: PARISHATH_NAME,
    description,
    image: `${API_URL}/parishath-logo.jpg`,
    prefill,
    theme: { color: colors.brand600 },
  });

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: { type?: string; error?: string } & Partial<RazorpaySuccess>;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'success' && msg.order_id && msg.payment_id && msg.signature) {
      onSuccess({ order_id: msg.order_id, payment_id: msg.payment_id, signature: msg.signature });
    } else if (msg.type === 'dismiss') {
      onDismiss();
    } else if (msg.type === 'failed') {
      onFailure(msg.error || 'Payment failed');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: colors.ivory }}>
        {visible ? (
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: API_URL }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            // UPI apps (GPay, PhonePe, Paytm…) open through upi:// and intent:// links
            onShouldStartLoadWithRequest={(req) => {
              if (/^(https?|about|data|blob):/i.test(req.url)) return true;
              Linking.openURL(req.url).catch(() => onFailure('Could not open the payment app'));
              return false;
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}
