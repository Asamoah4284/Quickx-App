import { Screen } from '@/components/ui/Screen';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function MentorshipScreen() {
  return (
    <Screen contentStyle={{ paddingBottom: 110 }}>
      <ComingSoon
        title="Mentorship"
        description="Subscribe to Basic, Premium, or 1-on-1 mentorship plans with Forex, Business, Career, and Digital Skills mentors."
      />
    </Screen>
  );
}
