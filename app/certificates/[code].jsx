import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { certificateUrl, verifyCertificate } from '@/utils/certificates';

function formatDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CertificateScreen() {
  const { code } = useLocalSearchParams();
  const [cert, setCert] = useState(undefined);

  useEffect(() => {
    verifyCertificate(String(code)).then(setCert).catch(() => setCert(null));
  }, [code]);

  if (cert === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!cert) {
    return (
      <View style={styles.center}>
        <FontAwesome name="times-circle" size={36} color={colors.danger} />
        <Text style={styles.missing}>Certificate not found</Text>
      </View>
    );
  }

  const url = certificateUrl(cert.code);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.verified}>
        <FontAwesome name="check-circle" size={14} color={colors.success} />
        <Text style={styles.verifiedText}>Verified by QuickX Learn</Text>
      </View>

      <View style={styles.certificate}>
        <LinearGradient colors={['#0B1F44', '#1B5EF5', '#E8B020']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stripe} />
        <View style={styles.inner}>
          <View style={styles.seal}>
            <FontAwesome name="certificate" size={30} color={colors.goldDark} />
          </View>
          <Text style={styles.brand}>QUICKX LEARN</Text>
          <Text style={styles.heading}>Certificate of Completion</Text>
          <Text style={styles.small}>This certifies that</Text>
          <Text style={styles.name}>{cert.studentName}</Text>
          <Text style={styles.small}>has successfully completed</Text>
          <Text style={styles.course}>{cert.courseTitle}</Text>

          <View style={styles.footer}>
            <View style={styles.footItem}>
              <Text style={styles.footValue}>{formatDate(cert.completedAt)}</Text>
              <Text style={styles.footLabel}>Date completed</Text>
            </View>
            <View style={styles.footItem}>
              <Text style={styles.footValue} numberOfLines={2}>
                {cert.instructorName}
              </Text>
              <Text style={styles.footLabel}>Instructor</Text>
            </View>
          </View>
          <Text style={styles.code}>{cert.code}</Text>
        </View>
      </View>

      <PrimaryButton
        label="Share certificate"
        icon="share-alt"
        onPress={() => Share.share({ message: `I just earned my “${cert.courseTitle}” certificate on QuickX Learn! ${url}`, url }).catch(() => {})}
        style={{ marginTop: spacing.xl }}
      />
      <PrimaryButton
        label="Open printable version"
        icon="print"
        variant="secondary"
        onPress={() => Linking.openURL(url).catch(() => {})}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.surface },
  missing: { fontWeight: '800', color: colors.text, fontSize: 16 },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EAF8EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  verifiedText: { color: '#13803C', fontWeight: '700', fontSize: 12 },
  certificate: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  stripe: { height: 6 },
  inner: { padding: spacing.xl, alignItems: 'center' },
  seal: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF7E0', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  brand: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 3 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.navy, marginTop: 6, textAlign: 'center' },
  small: { color: colors.muted, marginTop: spacing.lg, fontSize: 13 },
  name: { fontSize: 26, fontWeight: '800', color: colors.navy, marginTop: 6, textAlign: 'center', letterSpacing: -0.4 },
  course: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 6, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl, alignSelf: 'stretch' },
  footItem: { flex: 1, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  footValue: { fontWeight: '700', color: colors.text, textAlign: 'center', fontSize: 13 },
  footLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  code: { marginTop: spacing.lg, color: colors.muted, fontSize: 10, letterSpacing: 0.5 },
});
