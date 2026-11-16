import { createContext, useContext } from 'react';
import { Linking, Text, View } from 'react-native';

import { Avatar, Badge, Row, Txt } from '@/components/ui/kit';
import { assetUrl } from '@/constants/api';
import { fonts, t } from '@/constants/theme';

/** All community endpoints live under this path ("main" is the one community). */
export const BASE = '/community/main';

/** { about, me, reloadAbout }, provided by the Community tab. */
export const CommunityContext = createContext(null);
export function useCommunity() {
  return useContext(CommunityContext);
}

/** Author line used on posts, comments, questions and answers. */
export function Author({ user, when, size = 38, extra }) {
  const community = useCommunity();
  const id = user?._id || user?.id;
  const isMentor = id && String(id) === String(community?.about?.owner?.id);
  return (
    <Row gap={10} style={{ flex: 1, minWidth: 0 }}>
      <Avatar uri={assetUrl(user?.profilePicture)} name={user?.fullName} size={size} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Txt size={14} weight="semibold" numberOfLines={1}>
            {user?.fullName || 'Former member'}
          </Txt>
          {isMentor ? <Badge label="Mentor" tone="brand" /> : null}
          {extra}
        </Row>
        {when ? (
          <Txt size={12} color={t.fgSubtle}>
            {when}
          </Txt>
        ) : null}
      </View>
    </Row>
  );
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}'"])/g;

/** Plain text with tappable links and highlighted @mentions. Never renders HTML from members. */
export function RichText({ text, size = 15, color = t.fg, style }) {
  const parts = String(text || '').split(URL_RE);
  return (
    <Text style={[{ fontFamily: fonts.regular, fontSize: size, color, lineHeight: Math.round(size * 1.5) }, style]}>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <Text key={i} style={{ color: t.brand400 }} onPress={() => Linking.openURL(part).catch(() => {})}>
              {part}
            </Text>
          );
        }
        return part.split(/(@"[^"]+"|@[A-Za-z][A-Za-z0-9._-]{1,40})/g).map((piece, j) =>
          piece.startsWith('@') ? (
            <Text key={`${i}-${j}`} style={{ color: t.brand300, fontFamily: fonts.semibold }}>
              {piece}
            </Text>
          ) : (
            piece
          )
        );
      })}
    </Text>
  );
}
