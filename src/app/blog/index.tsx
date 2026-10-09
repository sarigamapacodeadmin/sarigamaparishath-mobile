import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Banner, Card, Chip, Loading, styles as ui } from '../../components/ui';
import { formatDate, pick } from '../../lib/format';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import type { BlogPost } from '../../shared/types';

// Published blog posts with search and categories, as on the website's /blog
export default function BlogListScreen() {
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    const { data, error: dbError } = await supabase
      .from('blog_posts')
      .select('id, title, title_te, slug, excerpt, excerpt_te, featured_image_url, category, author, featured, views, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (dbError) setError(t('Could not load articles. Pull down to try again.', 'వ్యాసాలు లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించడానికి క్రిందికి లాగండి.'));
    else setPosts((data as BlogPost[]) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(posts.map((p) => p.category).filter(Boolean))), [posts]);
  const q = search.trim().toLowerCase();
  const shown = posts.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || `${p.title} ${p.title_te || ''} ${p.excerpt} ${p.excerpt_te || ''}`.toLowerCase().includes(q))
  );

  return (
    <FlatList
      style={ui.screen}
      contentContainerStyle={ui.screenContent}
      data={loading ? [] : shown}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View>
          <TextInput
            style={[ui.input, { marginBottom: 12 }]}
            placeholder={t('Search articles', 'వ్యాసాలను వెతకండి')}
            placeholderTextColor={colors.subtle}
            value={search}
            onChangeText={setSearch}
          />
          {categories.length > 1 && (
            <View style={styles.chips}>
              <Chip label={t('All', 'అన్నీ')} selected={!category} onPress={() => setCategory(null)} />
              {categories.map((c) => (
                <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          )}
          <Banner type="error" text={error} />
        </View>
      }
      ListEmptyComponent={loading ? <Loading /> : !error ? <Text style={ui.muted}>{t('No articles found.', 'వ్యాసాలు ఏవీ లేవు.')}</Text> : null}
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
      renderItem={({ item: p }) => (
        <Pressable onPress={() => router.push(`/blog/${p.slug}`)} accessibilityRole="button">
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {p.featured_image_url ? <Image source={{ uri: p.featured_image_url }} style={styles.image} resizeMode="cover" /> : null}
            <View style={{ padding: 16 }}>
              {p.category ? <Text style={styles.category}>{p.category}</Text> : null}
              <Text style={styles.title}>{pick(language, p.title, p.title_te)}</Text>
              <Text style={ui.muted} numberOfLines={3}>
                {pick(language, p.excerpt, p.excerpt_te)}
              </Text>
              <Text style={styles.meta}>
                {[p.author, formatDate(p.created_at, language)].filter(Boolean).join('  •  ')}
              </Text>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  image: { width: '100%', height: 170, backgroundColor: colors.gold100 },
  category: { fontSize: 12, color: colors.vermilion600, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  title: { fontSize: 18, color: colors.brand600, fontWeight: '600', marginTop: 4, marginBottom: 6 },
  meta: { color: colors.subtle, fontSize: 13, marginTop: 8 },
});
