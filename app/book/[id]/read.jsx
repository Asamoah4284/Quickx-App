import { useEffect, useState } from 'react';
import { Alert as NativeAlert, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { Button, Card, Icon, Loading, Row, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { layout, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchBookContent } from '@/utils/catalog';
import { openExternalUrl } from '@/utils/openUrl';

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAppState();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || token === 'local') {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    fetchBookContent(String(id), token)
      .then((item) => {
        if (alive) setBook(item);
      })
      .catch(() => {
        if (alive) setBook(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, token]);

  if (!token || token === 'local') {
    return (
      <Page back title="Read">
        <EmptyState icon="book" title="Sign in to read" subtitle="Sign in to open the books you have bought." />
      </Page>
    );
  }

  if (loading) {
    return (
      <Page back title="Read">
        <Loading label="Opening your book" />
      </Page>
    );
  }

  if (!book) {
    return (
      <Page back title="Read">
        <EmptyState icon="lock" title="This book is not unlocked yet" subtitle="Buy the book to read the full content.">
          <Button label="View book" onPress={() => router.replace(`/book/${id}`)} />
        </EmptyState>
      </Page>
    );
  }

  const openFile = () => {
    if (!book.fileUrl) {
      NativeAlert.alert('No file yet', 'This book does not have a file to open yet.');
      return;
    }
    openExternalUrl(book.fileUrl).catch(() => Linking.openURL(book.fileUrl));
  };

  return (
    <Page back title={book.title} subtitle={book.author ? `by ${book.author}` : undefined}>
      {book.fileUrl ? (
        <Button label="Open the book" icon="book-open" size="lg" onPress={openFile} />
      ) : (
        <Card>
          <Txt size={14} color={t.fgMuted}>
            The book file will appear here once it is ready.
          </Txt>
        </Card>
      )}

      {book.whatYoullLearn?.length ? (
        <Card style={{ marginTop: layout.section, gap: 10 }}>
          <Txt size={16} weight="bold">
            What you will learn
          </Txt>
          {book.whatYoullLearn.map((line) => (
            <Row key={line} align="flex-start" gap={10}>
              <Icon name="check" size={15} color={t.up} style={{ marginTop: 3 }} />
              <Txt size={14} color={t.fgMuted} style={{ flex: 1, lineHeight: 21 }}>
                {line}
              </Txt>
            </Row>
          ))}
        </Card>
      ) : null}

      {book.description ? (
        <View style={{ marginTop: layout.section }}>
          <Txt size={16} weight="bold" style={{ marginBottom: 8 }}>
            About this book
          </Txt>
          <Txt size={14.5} color={t.fgMuted} style={{ lineHeight: 22 }}>
            {book.description}
          </Txt>
        </View>
      ) : null}
    </Page>
  );
}
