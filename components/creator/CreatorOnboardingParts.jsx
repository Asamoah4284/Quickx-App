import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { creatorStatusLabel, creatorStatusTone } from '@/utils/creator';

export function CreatorStatusBadge({ status, style }) {
  return <Badge label={creatorStatusLabel(status)} tone={creatorStatusTone(status)} style={style} />;
}

export function WizardStepper({ steps, currentStep }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = currentStep === stepNumber;
          const completed = currentStep > stepNumber;
          const isLast = index === steps.length - 1;

          return (
            <View key={step.label} style={styles.step}>
              {!isLast ? (
                <View style={[styles.line, completed && styles.lineDone]} />
              ) : null}
              <View
                style={[
                  styles.circle,
                  completed && styles.circleDone,
                  active && styles.circleActive,
                ]}>
                {completed ? (
                  <FontAwesome name="check" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.circleText, active && styles.circleTextActive]}>{stepNumber}</Text>
                )}
              </View>
              <Text style={[styles.label, (active || completed) && styles.labelActive]} numberOfLines={2}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EDF5',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 2,
  },
  line: {
    position: 'absolute',
    top: 15,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E8EDF5',
    zIndex: 0,
  },
  lineDone: {
    backgroundColor: '#1B5EF5',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleDone: {
    backgroundColor: '#1B5EF5',
  },
  circleActive: {
    backgroundColor: '#0B1F44',
  },
  circleText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 13,
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  label: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 13,
  },
  labelActive: {
    color: '#0B1F44',
  },
});
