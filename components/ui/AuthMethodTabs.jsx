import { Tabs } from '@/components/ui/kit';

const METHODS = [
  { value: 'phone', label: 'Phone number' },
  { value: 'email', label: 'Email' },
];

/** Phone / Email switcher on the sign-in screens. */
export function AuthMethodTabs({ value, onChange }) {
  return <Tabs tabs={METHODS} value={value} onChange={onChange} />;
}
