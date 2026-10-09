import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, styles as ui } from '../../components/ui';
import { coverUrl, rupeesIN, type Book } from '../../lib/books-api';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';

// The Parishath's books with a search box, as on the website's /books
export default function BooksScreen() {
  const { language, t } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from('books').select('*');
      setBooks((data as Book[]) || []);
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const term = searchTerm.toLowerCase();
  const filteredBooks = books.filter((b) =>
    [b.title_en, b.title_te, b.author_en, b.author_te].some((v) => (v || '').toLowerCase().includes(term))
  );

  return (
    <FlatList
      style={ui.screen}
      contentContainerStyle={ui.screenContent}
      data={loading ? [] : filteredBooks}
      keyExtractor={(b) => String(b.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <Text style={styles.intro}>
            {language === 'en'
              ? 'Sacred texts and spiritual books from the Parishath'
              : 'పరిషత్ అందిస్తున్న పవిత్ర గ్రంథాలు మరియు ఆధ్యాత్మిక పుస్తకాలు'}
          </Text>
          <TextInput
            style={[ui.input, { marginBottom: 16 }]}
            placeholder={language === 'en' ? 'Search books...' : 'పుస్తకాలను వెతకండి...'}
            placeholderTextColor={colors.subtle}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {loading
            ? language === 'en'
              ? 'Loading books...'
              : 'పుస్తకాలు లోడ్ అవుతున్నాయి...'
            : language === 'en'
              ? 'No books found'
              : 'పుస్తకాలు కనుగొనబడలేదు'}
        </Text>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          colors={[colors.brand600]}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      renderItem={({ item: book }) => {
        const title = language === 'en' ? book.title_en : book.title_te || book.title_en;
        const cover = coverUrl(book.cover_image_url);
        return (
          <Pressable onPress={() => router.push(`/books/${book.id}`)} accessibilityRole="button" accessibilityLabel={title}>
            <Card>
              {cover ? (
                <View style={styles.coverWrap}>
                  <Image source={{ uri: cover }} style={styles.cover} resizeMode="contain" accessibilityLabel={title} />
                </View>
              ) : (
                <View style={styles.emojiWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Text style={{ fontSize: 60 }}>{book.cover_emoji || '📖'}</Text>
                </View>
              )}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.author}>{language === 'en' ? book.author_en : book.author_te || book.author_en}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>{rupeesIN(book.price)}</Text>
                {book.stock_quantity === 0 ? (
                  <Text style={styles.outOfStock}>{language === 'en' ? 'Out of stock' : 'ప్రతులు లేవు'}</Text>
                ) : (
                  <Text style={styles.view}>{language === 'en' ? 'View' : 'చూడండి'} →</Text>
                )}
              </View>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 16 },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 16, paddingVertical: 40 },
  coverWrap: { backgroundColor: '#fbf7ec', height: 224, borderRadius: 4, padding: 8, marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: '100%' },
  emojiWrap: { backgroundColor: '#fbf7ec', height: 160, borderRadius: 4, marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, color: colors.brand600, fontWeight: '600', marginBottom: 2 },
  author: { fontSize: 14, color: colors.muted, marginBottom: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: '600', color: colors.brand600 },
  outOfStock: { fontSize: 14, color: colors.vermilion600 },
  view: { color: colors.brand600, fontWeight: '600' },
});
