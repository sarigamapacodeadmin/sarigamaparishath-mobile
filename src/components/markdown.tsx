import type { ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';
import { colors } from '../lib/theme';

// A small Markdown renderer for blog posts (headings, paragraphs, lists, quotes,
// **bold**, *italic* and [links](url)). The website renders the same text with
// react-markdown; posts use only these basics.

function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(<Text key={m.index} style={{ fontWeight: '700' }}>{token.slice(2, -2)}</Text>);
    } else if (token.startsWith('[')) {
      const [, label, url] = token.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
      parts.push(
        <Text key={m.index} style={{ color: colors.brand600, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(url)}>
          {label}
        </Text>
      );
    } else {
      parts.push(<Text key={m.index} style={{ fontStyle: 'italic' }}>{token.slice(1, -1)}</Text>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const body = { fontSize: 16, lineHeight: 26, color: '#374151' };

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <View>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (heading && !trimmed.includes('\n')) {
          const size = [26, 22, 19, 17, 16, 16][heading[1].length - 1];
          return (
            <Text key={i} style={{ fontSize: size, fontWeight: '600', color: colors.brand600, marginTop: 10, marginBottom: 8 }}>
              <Inline text={heading[2]} />
            </Text>
          );
        }
        const lines = trimmed.split('\n');
        if (lines.every((l) => /^\s*([-*+]|\d+[.)])\s+/.test(l))) {
          return (
            <View key={i} style={{ marginBottom: 12 }}>
              {lines.map((l, j) => {
                const numbered = l.match(/^\s*(\d+)[.)]\s+/);
                return (
                  <View key={j} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <Text style={[body, { width: 24 }]}>{numbered ? `${numbered[1]}.` : '•'}</Text>
                    <Text style={[body, { flex: 1 }]}>
                      <Inline text={l.replace(/^\s*([-*+]|\d+[.)])\s+/, '')} />
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }
        if (lines.every((l) => l.startsWith('>'))) {
          return (
            <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.gold500, paddingLeft: 12, marginBottom: 12 }}>
              <Text style={[body, { fontStyle: 'italic' }]}>
                <Inline text={lines.map((l) => l.replace(/^>\s?/, '')).join('\n')} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={[body, { marginBottom: 12 }]}>
            <Inline text={lines.join('\n')} />
          </Text>
        );
      })}
    </View>
  );
}
