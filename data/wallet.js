export const initialWallet = {
  balance: 850,
  currency: 'GH₵',
};

export const initialTransactions = [
  {
    id: 'tx1',
    type: 'deposit',
    label: 'Mobile Money deposit',
    amount: 500,
    date: '2026-08-18',
    status: 'completed',
  },
  {
    id: 'tx2',
    type: 'payment',
    label: 'Course: AI Study Systems',
    amount: -0,
    date: '2026-08-17',
    status: 'completed',
  },
  {
    id: 'tx3',
    type: 'payment',
    label: 'Book: Prompt Like a Pro',
    amount: -45,
    date: '2026-08-15',
    status: 'completed',
  },
];

export const notifications = [
  {
    id: 'n1',
    title: 'Session reminder',
    body: 'Your strategy session with Kwame is tomorrow at 14:00.',
    time: '2h ago',
  },
  {
    id: 'n2',
    title: 'New course offer',
    body: 'Advanced Price Action is 15% off this week.',
    time: 'Yesterday',
  },
  {
    id: 'n3',
    title: 'Wallet update',
    body: 'Deposit of GH₵500 was successful.',
    time: '3 days ago',
  },
];
