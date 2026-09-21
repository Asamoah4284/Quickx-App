import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';

const TOOLS = [
  { title: 'Lesson explainer', body: 'Summarize a course lesson and generate quiz questions from your enrolled content.' },
  { title: 'Study planner', body: 'Build a weekly learning schedule based on your saved courses and goals.' },
  { title: 'Concept checker', body: 'Ask follow-up questions about topics from QuickX courses.' },
];

export default function AIScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Text style={typography.h2}>QuickX AI</Text>
        <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
          Your learning copilot for QuickX courses — study smarter with guided explanations and planning tools.
        </Text>

        {TOOLS.map((tool) => (
          <View key={tool.title} style={styles.card}>
            <Text style={styles.title}>{tool.title}</Text>
            <Text style={styles.body}>{tool.body}</Text>
          </View>
        ))}

        <PrimaryButton label="Go to my courses" onPress={() => router.push('/my-courses')} style={{ marginTop: spacing.lg }} />
        <PrimaryButton label="Open learning assistant tips" variant="secondary" onPress={() => router.push('/analysis')} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  body: { color: colors.muted, marginTop: spacing.sm, lineHeight: 20 },
});
