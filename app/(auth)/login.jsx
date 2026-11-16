import { useState } from 'react';

import { AuthMethodTabs } from '@/components/ui/AuthMethodTabs';
import { EmailAuth } from '@/components/ui/EmailAuth';
import { PhoneAuth } from '@/components/ui/PhoneAuth';

export default function LoginScreen() {
  const [method, setMethod] = useState('phone');
  const tabs = <AuthMethodTabs value={method} onChange={setMethod} />;

  return method === 'phone' ? <PhoneAuth mode="login" top={tabs} /> : <EmailAuth top={tabs} />;
}
