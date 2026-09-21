import { api } from '@/constants/api';

export async function updateAccount(token, fields) {
  const data = await api('/users/me/account', {
    method: 'PATCH',
    token,
    body: fields,
  });
  return data.user;
}
