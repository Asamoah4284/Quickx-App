import { Redirect, useLocalSearchParams } from 'expo-router';

/** Paid program SKUs are not used in the mobile creator flow — redirect to free creator onboarding. */
export default function ProgramSlugRedirect() {
  const { slug } = useLocalSearchParams();
  return <Redirect href="/programs" />;
}
