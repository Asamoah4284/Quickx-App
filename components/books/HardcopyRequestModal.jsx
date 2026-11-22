import React, { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatPriceCedi } from '@/utils/format';
import { themed } from '@/utils/themedStyles';

const WHATSAPP_NUMBER = '233559037872';

export function HardcopyRequestModal({ book, visible, onClose, user }) {
  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(user?.fullName || '');
    setPhone(user?.phone || '');
    setLocation('');
  }, [visible, user?.fullName, user?.phone]);

  if (!book || !visible) return null;

  const hardcopyAmount =
    book.hardcopyPrice != null && book.hardcopyPrice !== ''
      ? Number(book.hardcopyPrice)
      : Number(book.price ?? 0);

  const submit = async () => {
    const lines = [
      'New Hardcopy Request:',
      '',
      `Book: ${book.title}`,
      book.author ? `Author: ${book.author}` : null,
      `Price: ${formatPriceCedi(hardcopyAmount)}`,
      'Delivery: Free',
      'Qty: 1',
      `Name: ${name.trim()}`,
      phone.trim() ? `Phone: ${phone.trim()}` : null,
      `Delivery location: ${location.trim()}`,
    ].filter(Boolean);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    await Linking.openURL(url);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={typography.h3}>Request hardcopy</Text>
          <Text style={styles.hint}>Free delivery. We&apos;ll confirm on WhatsApp.</Text>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.price}>{formatPriceCedi(hardcopyAmount)}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="phone-pad"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Delivery location"
            placeholderTextColor={colors.muted}
          />
          <PrimaryButton
            label="Send via WhatsApp"
            onPress={submit}
            disabled={!name.trim() || !phone.trim() || !location.trim()}
          />
          <PrimaryButton label="Cancel" variant="ghost" onPress={onClose} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    hint: { color: colors.muted, lineHeight: 18 },
    bookTitle: { fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    price: { color: colors.primary, fontWeight: '800' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.text,
    },
  })
);
