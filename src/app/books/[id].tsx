import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { RazorpayCheckout, type RazorpaySuccess } from '../../components/razorpay-checkout';
import { Button, Card, Loading, Screen, styles as ui } from '../../components/ui';
import { coverUrl, createBookOrder, rupeesIN, verifyBookPayment, type Book } from '../../lib/books-api';
import { RAZORPAY_KEY_ID } from '../../lib/config';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A book with its details and the Razorpay purchase form, as on the website's /books/[id]
export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyMessage, setBuyMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [order, setOrder] = useState<{ id: string; amount: number } | null>(null);

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setError('No book ID');
          return;
        }
        const bookId = parseInt(Array.isArray(id) ? id[0] : String(id), 10);
        if (isNaN(bookId)) {
          setError('Invalid ID');
          return;
        }
        const { data, error: dbError } = await supabase.from('books').select('*').eq('id', bookId).single();
        if (dbError || !data) {
          setError('Book not found');
          return;
        }
        setBook(data as Book);
      } catch {
        setError('Error loading book');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!customerName.trim()) errors.name = t('Name is required', 'పేరు తప్పనిసరి');
    if (!customerEmail.trim()) errors.email = t('Email is required', 'ఈమెయిల్ తప్పనిసరి');
    else if (!EMAIL_RE.test(customerEmail)) errors.email = t('Please enter a valid email', 'దయచేసి సరైన ఈమెయిల్ ఇవ్వండి');
    if (!customerPhone.trim()) errors.phone = t('Phone number is required', 'ఫోన్ నంబర్ తప్పనిసరి');
    else if (!/^\d{10}$/.test(customerPhone.replace(/\D/g, '')))
      errors.phone = t('Please enter a valid 10-digit phone number', 'దయచేసి సరైన 10 అంకెల ఫోన్ నంబర్ ఇవ్వండి');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBuyNow = async () => {
    if (!book) {
      setBuyMessage('❌ ' + t('Book not loaded', 'పుస్తకం లోడ్ కాలేదు'));
      return;
    }
    if (!validateForm()) {
      setBuyMessage('❌ ' + t('Please fill in all details correctly', 'దయచేసి అన్ని వివరాలు సరిగ్గా నింపండి'));
      return;
    }
    setIsProcessing(true);
    setBuyMessage('⏳ ' + t('Loading payment gateway...', 'చెల్లింపు గేట్‌వే లోడ్ అవుతోంది...'));

    if (!RAZORPAY_KEY_ID) {
      setBuyMessage(
        '❌ ' + t('Error: Razorpay not configured. Contact admin.', 'లోపం: చెల్లింపు సెటప్ కాలేదు. నిర్వాహకులను సంప్రదించండి.')
      );
      setIsProcessing(false);
      return;
    }

    try {
      // The server sets the price from the books table
      const orderData = await createBookOrder(book.id, { name: customerName, email: customerEmail, phone: customerPhone });
      setOrder({ id: orderData.order.id, amount: orderData.order.amount });
    } catch (err) {
      setBuyMessage('❌ ' + (err instanceof Error ? err.message : 'Could not start payment'));
      setIsProcessing(false);
    }
  };

  const onPaid = async (response: RazorpaySuccess) => {
    setOrder(null);
    setBuyMessage('⏳ ' + t('Confirming payment...', 'చెల్లింపు నిర్ధారిస్తోంది...'));
    try {
      const verifyData = await verifyBookPayment(response);
      setBuyMessage(
        verifyData.receipt_emailed
          ? '✅ ' +
              t(
                `Payment successful! Receipt ${verifyData.receipt_number} has been emailed to ${customerEmail}.`,
                `చెల్లింపు విజయవంతమైంది! రసీదు ${verifyData.receipt_number} ${customerEmail}కు ఈమెయిల్ చేయబడింది.`
              )
          : verifyData.receipt_number
            ? '✅ ' +
              t(
                `Payment successful! Your receipt number is ${verifyData.receipt_number}.`,
                `చెల్లింపు విజయవంతమైంది! మీ రసీదు సంఖ్య ${verifyData.receipt_number}.`
              )
            : '✅ ' +
              t(
                'Payment successful! Your order has been saved. Your receipt will be emailed shortly.',
                'చెల్లింపు విజయవంతమైంది! మీ ఆర్డర్ సేవ్ అయింది. మీ రసీదు త్వరలో ఈమెయిల్ చేయబడుతుంది.'
              )
      );
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
      setBuyMessage(
        '⚠️ ' +
          t(
            'Payment received but confirmation failed. Please contact us with payment ID ',
            'చెల్లింపు అందింది కానీ నిర్ధారణ విఫలమైంది. దయచేసి ఈ చెల్లింపు ID తో మమ్మల్ని సంప్రదించండి: '
          ) +
          response.payment_id +
          detail
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/books'));
  const backLink = (
    <Pressable onPress={goBack} accessibilityRole="link" style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
      <Text style={styles.back}>← {t('Back to books', 'పుస్తకాలకు తిరిగి వెళ్ళండి')}</Text>
    </Pressable>
  );

  if (loading) return <Loading />;

  if (error || !book) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 18, color: '#374151', marginBottom: 20 }}>{t('Book not found', 'పుస్తకం కనుగొనబడలేదు')}</Text>
          {backLink}
        </View>
      </Screen>
    );
  }

  const title = language === 'te' && book.title_te ? book.title_te : book.title_en;
  const author = language === 'te' && book.author_te ? book.author_te : book.author_en;
  const description = (language === 'te' && book.description_te) || book.description_en;
  const outOfStock = book.stock_quantity === 0;
  const cover = coverUrl(book.cover_image_url);
  const price = rupeesIN(book.price);
  const tone = buyMessage.startsWith('✅') ? styles.msgSuccess : buyMessage.startsWith('❌') ? styles.msgError : styles.msgInfo;
  const toneText = buyMessage.startsWith('✅') ? colors.brand700 : buyMessage.startsWith('❌') ? colors.vermilion700 : '#1f2937';

  const details: [string, string | number][] = [];
  if (book.category) details.push([t('Category', 'విభాగం'), book.category]);
  if (book.isbn) details.push(['ISBN', book.isbn]);
  if (book.pages) details.push([t('Pages', 'పేజీలు'), book.pages]);
  if (book.publication_year) details.push([t('Published', 'ప్రచురణ సంవత్సరం'), book.publication_year]);
  if (book.publisher_en) details.push([t('Publisher', 'ప్రచురణకర్త'), (language === 'te' && book.publisher_te) || book.publisher_en]);

  const input = (field: string, props: TextInputProps) => (
    <>
      <TextInput
        placeholderTextColor={colors.subtle}
        editable={!isProcessing}
        style={[ui.input, { marginTop: 4 }, formErrors[field] ? { borderColor: '#bf563b' } : null, isProcessing && { opacity: 0.6 }]}
        {...props}
      />
      {formErrors[field] ? <Text style={styles.fieldError}>{formErrors[field]}</Text> : null}
    </>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      {backLink}

      {cover ? (
        <Card style={styles.coverCard}>
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="contain" accessibilityLabel={t(book.title_en, book.title_te || book.title_en)} />
        </Card>
      ) : (
        <Card style={styles.emojiCard}>
          <Text style={{ fontSize: 110 }} accessibilityElementsHidden importantForAccessibility="no">
            {book.cover_emoji || '📖'}
          </Text>
        </Card>
      )}

      {/* Title, price and purchase form */}
      <Text style={styles.title}>{title}</Text>
      {author ? (
        <Text style={styles.author}>
          {t('by', 'రచయిత:')} {author}
        </Text>
      ) : null}
      <View style={styles.rule} />

      <View style={styles.priceRow}>
        <Text style={styles.price}>{price}</Text>
        {outOfStock ? (
          <Text style={[styles.pill, styles.pillOut]}>{t('Out of stock', 'ప్రతులు లేవు')}</Text>
        ) : (book.stock_quantity ?? 0) > 0 ? (
          <Text style={[styles.pill, styles.pillIn]}>
            {t(`${book.stock_quantity} copies available`, `${book.stock_quantity} ప్రతులు అందుబాటులో ఉన్నాయి`)}
          </Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>{t('Your details', 'మీ వివరాలు')}</Text>

        <View style={ui.field}>
          <Text style={styles.label}>{t('Full name', 'పూర్తి పేరు')} *</Text>
          {input('name', {
            value: customerName,
            autoComplete: 'name',
            onChangeText: (v) => {
              setCustomerName(v);
              if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
            },
          })}
        </View>

        <View style={ui.field}>
          <Text style={styles.label}>{t('Email', 'ఈమెయిల్')} *</Text>
          {input('email', {
            value: customerEmail,
            autoComplete: 'email',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            onChangeText: (v) => {
              setCustomerEmail(v);
              if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
            },
          })}
        </View>

        <View style={ui.field}>
          <Text style={styles.label}>{t('Phone (10 digits)', 'ఫోన్ నంబర్ (10 అంకెలు)')} *</Text>
          {input('phone', {
            value: customerPhone,
            autoComplete: 'tel',
            keyboardType: 'number-pad',
            onChangeText: (v) => {
              setCustomerPhone(v.replace(/\D/g, '').slice(0, 10));
              if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
            },
          })}
        </View>

        <Button
          onPress={handleBuyNow}
          disabled={outOfStock || isProcessing}
          label={
            isProcessing
              ? t('Processing...', 'ప్రాసెస్ అవుతోంది...')
              : outOfStock
                ? t('Out of stock', 'ప్రతులు లేవు')
                : t(`Buy for ${price}`, `${price} చెల్లించి కొనండి`)
          }
        />

        {buyMessage ? (
          <View style={[styles.msg, tone]} accessibilityLiveRegion="polite">
            <Text style={{ color: toneText, fontSize: 14 }}>{buyMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.note}>{t('A receipt is emailed to you after payment.', 'చెల్లింపు తర్వాత రసీదు మీ ఈమెయిల్‌కు పంపబడుతుంది.')}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>{t('About this book', 'ఈ పుస్తకం గురించి')}</Text>
        <Text style={styles.description}>{description || t('No description available', 'వివరణ అందుబాటులో లేదు')}</Text>
        {details.length > 0 && (
          <View style={styles.details}>
            {details.map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {order && (
        <RazorpayCheckout
          visible
          orderId={order.id}
          amountPaise={order.amount}
          description={'Book Purchase: ' + book.title_en}
          prefill={{ name: customerName, email: customerEmail, contact: customerPhone }}
          onSuccess={onPaid}
          onDismiss={() => {
            setOrder(null);
            setBuyMessage('❌ ' + t('Payment cancelled', 'చెల్లింపు రద్దు చేయబడింది'));
            setIsProcessing(false);
          }}
          onFailure={(text) => {
            setOrder(null);
            setBuyMessage('❌ ' + t('Error: ', 'లోపం: ') + text);
            setIsProcessing(false);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.brand600, fontWeight: '600', fontSize: 15 },
  coverCard: { alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 380 },
  emojiCard: { height: 288, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, color: colors.brand600, fontWeight: '600', marginTop: 6, marginBottom: 6 },
  author: { fontSize: 18, color: colors.muted, marginBottom: 12 },
  rule: { width: 96, height: 2, backgroundColor: colors.gold500, marginBottom: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 18 },
  price: { fontSize: 28, fontWeight: '600', color: colors.brand600 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1, fontSize: 14, overflow: 'hidden' },
  pillOut: { backgroundColor: colors.vermilion50, color: colors.vermilion700, borderColor: colors.vermilion200 },
  pillIn: { backgroundColor: colors.brand50, color: colors.brand700, borderColor: '#c8cee5' },
  panel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gold200, borderRadius: 6, padding: 18, marginBottom: 14 },
  section: { fontSize: 20, color: colors.brand600, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  fieldError: { fontSize: 12, color: colors.vermilion600, marginTop: 4 },
  msg: { padding: 12, borderRadius: 6, borderWidth: 1, marginTop: 12 },
  msgSuccess: { backgroundColor: colors.brand50, borderColor: '#c8cee5' },
  msgError: { backgroundColor: colors.vermilion50, borderColor: colors.vermilion200 },
  msgInfo: { backgroundColor: '#fbf7ec', borderColor: '#ddbe74' },
  note: { fontSize: 12, color: colors.muted, marginTop: 12 },
  description: { color: '#374151', fontSize: 15, lineHeight: 24 },
  details: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gold200 },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { color: colors.muted, fontSize: 14, width: 130 },
  detailValue: { color: '#111827', fontWeight: '600', fontSize: 14, flex: 1 },
});
