import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { PhoneAuth } from '@/components/ui/PhoneAuth';
import { EmailAuth } from '@/components/ui/EmailAuth';
import { colors, radii, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [method, setMethod] = useState('phone');

  return (
    <View style={styles.root}>
      <View style={styles.switcher}>
        <Pressable
          onPress={() => setMethod('phone')}
          style={[styles.tab, method === 'phone' && styles.tabActive]}>
          <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>Phone</Text>
        </Pressable>
        <Pressable
          onPress={() => setMethod('email')}
          style={[styles.tab, method === 'email' && styles.tabActive]}>
          <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>Email</Text>
        </Pressable>
      </View>

      {method === 'phone' ? <PhoneAuth mode="login" /> : <EmailAuth />}

      {method === 'phone' ? (
        <View style={styles.altRow}>
          <Text style={styles.altText}>Have an email account? </Text>
          <Pressable onPress={() => setMethod('email')}>
            <Text style={styles.link}>Sign in with email</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.altRow}>
          <Text style={styles.altText}>Prefer SMS? </Text>
          <Pressable onPress={() => setMethod('phone')}>
            <Text style={styles.link}>Use phone instead</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.muted, fontSize: 13 },
  tabTextActive: { color: colors.white },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  altText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
