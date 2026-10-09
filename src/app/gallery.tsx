import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Banner, Chip, Loading, styles as ui } from '../components/ui';
import { useLanguage } from '../lib/language';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { galleryCategoryLabel } from '../shared/gallery-labels';
import type { GalleryPhoto } from '../shared/types';

const GAP = 10;

// Photo gallery with a category filter and a full-screen view, as on the website's /gallery
export default function GalleryScreen() {
  const { language, t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [open, setOpen] = useState<GalleryPhoto | null>(null);

  const load = useCallback(async () => {
    setError('');
    const { data, error: dbError } = await supabase.from('gallery_photos').select('*').order('date', { ascending: false });
    if (dbError) setError(t('Could not load the gallery. Pull down to try again.', 'గ్యాలరీ లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించడానికి క్రిందికి లాగండి.'));
    else setPhotos((data as GalleryPhoto[]) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const categories = useMemo(() => (Array.from(new Set(photos.map((p) => p.category).filter(Boolean))) as string[]).sort(), [photos]);
  const shown = category === 'all' ? photos : photos.filter((p) => p.category === category);
  const tile = (width - 32 - GAP) / 2;

  return (
    <>
      <FlatList
        style={ui.screen}
        contentContainerStyle={ui.screenContent}
        data={loading ? [] : shown}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={
          <View>
            {categories.length > 1 && (
              <View style={styles.chips}>
                <Chip label={t('All', 'అన్నీ')} selected={category === 'all'} onPress={() => setCategory('all')} />
                {categories.map((c) => (
                  <Chip key={c} label={galleryCategoryLabel(c, language)} selected={category === c} onPress={() => setCategory(c)} />
                ))}
              </View>
            )}
            <Banner type="error" text={error} />
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : !error ? <Text style={ui.muted}>{t('No photos yet.', 'ఇంకా ఫోటోలు లేవు.')}</Text> : null}
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
          <Pressable onPress={() => setOpen(p)} accessibilityRole="imagebutton" style={{ width: tile, marginBottom: GAP }}>
            <Image
              source={{ uri: p.image_url }}
              style={[styles.thumb, { width: tile, height: tile }]}
              accessibilityLabel={p.alt_text || (language === 'en' ? p.title_en : p.title_te)}
            />
            <Text style={styles.caption} numberOfLines={2}>
              {language === 'en' ? p.title_en : p.title_te}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.lightbox}>
          <Pressable onPress={() => setOpen(null)} style={styles.close} accessibilityRole="button" accessibilityLabel={t('Close', 'మూసివేయండి')}>
            <Text style={{ color: colors.white, fontSize: 28 }}>✕</Text>
          </Pressable>
          {open && (
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
              <Image source={{ uri: open.image_url }} style={{ width, height: height * 0.6 }} resizeMode="contain" />
              <View style={{ padding: 16 }}>
                <Text style={styles.lbTitle}>{language === 'en' ? open.title_en : open.title_te}</Text>
                {(language === 'en' ? open.caption_en : open.caption_te) ? (
                  <Text style={styles.lbText}>{language === 'en' ? open.caption_en : open.caption_te}</Text>
                ) : null}
                <Text style={styles.lbMeta}>
                  {new Date(open.date).toLocaleDateString(language === 'en' ? 'en-IN' : 'te-IN')}
                  {open.category ? `  •  ${galleryCategoryLabel(open.category, language)}` : ''}
                  {open.photographer_name ? `  •  📷 ${open.photographer_name}` : ''}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  thumb: { borderRadius: 6, backgroundColor: colors.gold100 },
  caption: { color: colors.brand600, fontWeight: '500', marginTop: 4, fontSize: 13 },
  lightbox: { flex: 1, backgroundColor: 'rgba(10,14,32,0.96)', paddingTop: 50 },
  close: { position: 'absolute', top: 10, right: 16, zIndex: 2, padding: 6 },
  lbTitle: { color: colors.white, fontSize: 20, fontWeight: '600', marginBottom: 6 },
  lbText: { color: '#e5e7eb', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  lbMeta: { color: colors.gold200, fontSize: 13 },
});
