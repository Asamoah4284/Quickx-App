import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert as NativeAlert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { plansFor } from '@/components/FeatureGate';
import { Avatar, Badge, Button, Card, Divider, Icon, IconBox, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Logo } from '@/components/ui/Logo';
import { Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { assetUrl } from '@/constants/api';
import { FEATURE_LIST, LINKS } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { cedis } from '@/utils/currency';
import { daysLeft, formatDate } from '@/utils/format';
import { promptProfilePhoto } from '@/utils/profilePhoto';

function MenuRow({ icon, label, detail, onPress, danger, last }) {
  return (
    <>
      <PressableScale haptic="select" scaleTo={0.99} onPress={onPress} style={styles.row}>
        <Icon name={icon} size={18} color={danger ? t.down : t.fgMuted} />
        <Txt size={15} weight="medium" color={danger ? t.down : t.fg} style={{ flex: 1 }}>
          {label}
        </Txt>
        {detail ? (
          <Txt size={13.5} color={t.fgSubtle} tabular>
            {detail}
          </Txt>
        ) : null}
        {!danger ? <Icon name="chevron-right" size={16} color={t.fgSubtle} /> : null}
      </PressableScale>
      {last ? null : <Divider style={{ marginLeft: 48 }} />}
    </>
  );
}

function Menu({ items }) {
  const list = items.filter(Boolean);
  return (
    <Card padded={false}>
      {list.map((item, i) => (
        <MenuRow key={item.label} {...item} last={i === list.length - 1} />
      ))}
    </Card>
  );
}

function AccessList() {
  const { has, expiryOf, isOwner } = useAppState();
  const { data } = useApi('/products');
  return (
    <Card padded={false}>
      {FEATURE_LIST.map((f, i) => {
        const on = isOwner || has(f.key);
        const endsAt = expiryOf(f.key);
        const left = daysLeft(endsAt);
        const { single } = plansFor(data?.products, f.key);
        const soon = on && endsAt && left <= 7;
        return (
          <View key={f.key}>
            {i ? <Divider /> : null}
            <Row gap={12} style={{ padding: 14 }}>
              <IconBox name={f.icon} size={38} iconSize={17} tone={on ? 'brand' : 'neutral'} />
              <Pressable style={{ flex: 1 }} onPress={() => router.push(f.route)}>
                <Txt size={15} weight="semibold">
                  {f.label}
                </Txt>
                <Txt size={12.5} color={soon ? t.warn : t.fgSubtle} style={{ marginTop: 1 }}>
                  {isOwner ? 'Always on for the owner' : on ? (endsAt ? (soon ? `Ends in ${left} day${left === 1 ? '' : 's'}` : `Active until ${formatDate(endsAt)}`) : 'Active') : 'Not included'}
                </Txt>
              </Pressable>
              {isOwner ? null : on ? (
                soon && single ? (
                  <Button size="sm" label="Renew" onPress={() => router.push(`/checkout/${single.key}`)} />
                ) : (
                  <Badge label="Active" tone="up" dot />
                )
              ) : (
                <Button size="sm" variant="secondary" label="Get it" onPress={() => router.push(single ? `/checkout/${single.key}` : '/pricing')} />
              )}
            </Row>
          </View>
        );
      })}
    </Card>
  );
}

function SignedOut() {
  const { requireSignIn } = useAppState();
  return (
    <Page tabs title="Account">
      <View style={{ gap: 22 }}>
        <Rise>
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Logo size={34} />
            <Txt size={20} weight="bold" center style={{ marginTop: 18 }}>
              Sign in to QuickX Learn
            </Txt>
            <Txt size={14} color={t.fgMuted} center style={{ marginTop: 6, lineHeight: 20, maxWidth: 300 }}>
              See your plans, wallet, tickets and courses. Use your phone number or email.
            </Txt>
            <Button size="lg" label="Sign in or create account" style={{ alignSelf: 'stretch', marginTop: 20 }} onPress={() => requireSignIn()} />
          </Card>
        </Rise>
        <Menu
          items={[
            { icon: 'award', label: 'Plans and prices', onPress: () => router.push('/pricing') },
            { icon: 'book', label: 'Books', onPress: () => router.push('/books') },
            { icon: 'calendar', label: 'Events', onPress: () => router.push('/events') },
            { icon: 'download', label: 'Downloads', onPress: () => router.push('/downloads') },
          ]}
        />
        <Help />
      </View>
    </Page>
  );
}

function Help() {
  return (
    <View>
      <SectionTitle title="Help" />
      <Menu
        items={[
          { icon: 'message-circle', label: 'WhatsApp Maxwell', onPress: () => Linking.openURL(LINKS.whatsappMaxwell).catch(() => {}) },
          { icon: 'send', label: 'Telegram channel', onPress: () => Linking.openURL('https://t.me/quickxtrading').catch(() => {}) },
          { icon: 'globe', label: 'quickxlearn.com', onPress: () => Linking.openURL(LINKS.website).catch(() => {}) },
        ]}
      />
      <Txt size={11.5} color={t.fgSubtle} center style={{ marginTop: 16 }}>
        QuickX Learn {Constants.expoConfig?.version ? `v${Constants.expoConfig.version}` : ''}
      </Txt>
    </View>
  );
}

export default function AccountScreen() {
  const { isSignedIn, user, isOwner, walletBalance, logout, avatarUri, setAvatarUri, refreshAccess, loadWallet } = useAppState();
  if (!isSignedIn) return <SignedOut />;

  const photo = avatarUri || assetUrl(user?.profilePicture);
  const contact = user?.email || user?.phone || '';

  const signOut = () =>
    NativeAlert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Stay signed in', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <Page
      tabs
      title="Account"
      onRefresh={async () => {
        await Promise.all([Promise.resolve(refreshAccess?.()), Promise.resolve(loadWallet?.())]).catch(() => {});
      }}>
      <View style={{ gap: 24 }}>
        <Rise>
          <Card>
            <Row gap={14}>
              <Pressable
                onPress={() => promptProfilePhoto({ hasPhoto: Boolean(avatarUri), onPicked: setAvatarUri, onRemoved: () => setAvatarUri(null) })}
                accessibilityLabel="Change profile photo">
                <Avatar uri={photo} name={user?.fullName} size={60} />
                <View style={styles.camera}>
                  <Icon name="camera" size={11} color={t.white} />
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  <Txt size={18} weight="bold" numberOfLines={1}>
                    {user?.fullName || 'Member'}
                  </Txt>
                  {isOwner ? <Badge label="Owner" tone="warn" /> : null}
                </Row>
                {contact ? (
                  <Txt size={13} color={t.fgSubtle} numberOfLines={1} style={{ marginTop: 2 }}>
                    {contact}
                  </Txt>
                ) : null}
              </View>
              <Button variant="ghost" size="sm" icon="edit-2" label="Edit" onPress={() => router.push('/settings')} />
            </Row>
          </Card>
        </Rise>

        <Rise index={1}>
          <Card tone="brand" onPress={() => router.push('/wallet')}>
            <Row justify="space-between">
              <View>
                <Txt size={11.5} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Wallet
                </Txt>
                <Txt size={26} weight="bold" tabular style={{ marginTop: 2 }}>
                  {cedis(walletBalance || 0)}
                </Txt>
              </View>
              <Row gap={6}>
                <Txt size={13.5} weight="semibold" color={t.brand300}>
                  Open
                </Txt>
                <Icon name="chevron-right" size={16} color={t.brand300} />
              </Row>
            </Row>
          </Card>
        </Rise>

        <View>
          <SectionTitle title="Your access" action="All plans" onAction={() => router.push('/pricing')} />
          <AccessList />
        </View>

        {isOwner ? (
          <View>
            <SectionTitle title="Owner" />
            <Menu
              items={[
                { icon: 'plus-circle', label: 'Post a signal', onPress: () => router.push('/owner/signal') },
                { icon: 'monitor', label: 'Admin on the website', onPress: () => Linking.openURL(`${LINKS.website}/admin`).catch(() => {}) },
              ]}
            />
          </View>
        ) : null}

        <View>
          <SectionTitle title="Your stuff" />
          <Menu
            items={[
              { icon: 'bell', label: 'Notifications', onPress: () => router.push('/notifications') },
              { icon: 'target', label: 'Mentorship sessions', onPress: () => router.push('/mentorship') },
              { icon: 'pie-chart', label: 'Pie trading', onPress: () => router.push('/pie') },
              { icon: 'credit-card', label: 'Event tickets', onPress: () => router.push('/events/my-tickets') },
              { icon: 'book', label: 'Books', onPress: () => router.push('/books') },
              { icon: 'download', label: 'Downloads', onPress: () => router.push('/downloads') },
              { icon: 'settings', label: 'Profile details', onPress: () => router.push('/settings') },
            ]}
          />
        </View>

        <Help />

        <Menu items={[{ icon: 'log-out', label: 'Sign out', danger: true, onPress: signOut }]} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: t.brand600, borderWidth: 2, borderColor: t.card, alignItems: 'center', justifyContent: 'center' },
});
