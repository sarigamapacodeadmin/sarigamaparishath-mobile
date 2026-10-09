import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { Markdown } from '../../components/markdown';
import { Banner, Card, Loading, Screen, styles as ui } from '../../components/ui';
import { formatDate, pick } from '../../lib/format';
import { useLanguage } from '../../lib/language';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import type { BlogPost } from '../../shared/types';

// One blog post, with related posts from the same category
export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: dbError } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
      if (dbError || !data) {
        setError(t('Article not found', 'వ్యాసం కనబడలేదు'));
        return;
      }
      setPost(data as BlogPost);
      // Count the view, as the website does
      await supabase.from('blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
      const { data: more } = await supabase
        .from('blog_posts')
        .select('id, title, title_te, slug, excerpt, excerpt_te, featured_image_url, category, author, featured, views, created_at')
        .eq('category', data.category)
        .eq('status', 'published')
        .neq('id', data.id)
        .limit(3);
      setRelated((more as BlogPost[]) || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (error) {
    return (
      <Screen>
        <Banner type="error" text={error} />
      </Screen>
    );
  }
  if (!post) return <Loading />;

  const title = pick(language, post.title, post.title_te);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('Article', 'వ్యాసం') }} />
      {post.category ? <Text style={styles.category}>{post.category}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        {[post.author, formatDate(post.created_at, language, 'long'), post.views > 0 ? `${post.views} ${t('views', 'వీక్షణలు')}` : null]
          .filter(Boolean)
          .join('  •  ')}
      </Text>
      {post.featured_image_url ? <Image source={{ uri: post.featured_image_url }} style={styles.image} resizeMode="cover" /> : null}
      <Card>
        <Markdown source={pick(language, post.content, post.content_te)} />
      </Card>

      {related.length > 0 && (
        <>
          <Text style={styles.relatedHeading}>{t('Related articles', 'సంబంధిత వ్యాసాలు')}</Text>
          {related.map((r) => (
            <Pressable key={r.id} onPress={() => router.push(`/blog/${r.slug}`)} accessibilityRole="button">
              <Card>
                <Text style={styles.relatedTitle}>{pick(language, r.title, r.title_te)}</Text>
                <Text style={ui.muted} numberOfLines={2}>
                  {pick(language, r.excerpt, r.excerpt_te)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: { fontSize: 12, color: colors.vermilion600, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  title: { fontSize: 26, color: colors.brand600, fontWeight: '600', marginTop: 4, marginBottom: 6 },
  meta: { color: colors.subtle, fontSize: 13, marginBottom: 14 },
  image: { width: '100%', height: 210, borderRadius: 6, marginBottom: 14, backgroundColor: colors.gold100 },
  relatedHeading: { fontSize: 20, color: colors.brand600, fontWeight: '600', marginTop: 10, marginBottom: 10 },
  relatedTitle: { fontSize: 17, color: colors.brand600, fontWeight: '600', marginBottom: 4 },
});
