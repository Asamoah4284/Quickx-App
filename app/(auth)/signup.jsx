import { useState } from 'react';

import { AuthMethodTabs } from '@/components/ui/AuthMethodTabs';
import { EmailSignup } from '@/components/ui/EmailSignup';
import { PhoneAuth } from '@/components/ui/PhoneAuth';

export default function SignupScreen() {
  const [method, setMethod] = useState('phone');
  const tabs = <AuthMethodTabs value={method} onChange={setMethod} />;

  return method === 'phone' ? <PhoneAuth mode="signup" top={tabs} /> : <EmailSignup top={tabs} />;
}
