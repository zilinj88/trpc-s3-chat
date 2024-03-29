import { ScrollArea, Stack } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import React, { Fragment } from 'react';
import useAddNewMessage from '~/hooks/useAddNewMessage';
import useDeleteMessage from '~/hooks/useDeleteMessage';
import useMessagesQuery from '~/hooks/useMessagesQuery';
import ChatInputBox from './ChatInputBox';
import ChatMessage from './ChatMessage';

const pageSize = 20;

const ChatRoom = () => {
  const scrollViewRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [initiallyScrolled, setInitiallyScrolled] = React.useState(false);
  const msgQuery = useMessagesQuery(pageSize);

  // Define scroll to bottom method
  const scrollToBottom = React.useCallback(() => {
    let setScrolledTimeout: number | undefined;
    const timeout = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
      // After 3 seconds, enable to load more
      setScrolledTimeout = window.setTimeout(
        () => setInitiallyScrolled(true),
        3000,
      );
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      if (setScrolledTimeout) {
        window.clearTimeout(setScrolledTimeout);
      }
    };
  }, []);

  const intersection = useIntersection<HTMLDivElement>({
    root: scrollViewRef.current,
    threshold: 1,
  });

  // When message status changes, scroll to bottom
  React.useEffect(() => {
    if (msgQuery.status === 'success') {
      scrollToBottom();
    }
  }, [msgQuery.status, scrollToBottom]);

  React.useEffect(() => {
    // When intersection occurred,
    if (intersection.entry?.isIntersecting && !msgQuery.isLoading) {
      msgQuery.fetchPreviousPage();
      // Prevent more fetch recursively
      scrollViewRef.current?.scrollTo({ top: 10 });
    }
  }, [intersection.entry?.isIntersecting, msgQuery]);

  const addMessageMutation = useAddNewMessage(pageSize, scrollToBottom);
  const deleteMutation = useDeleteMessage(pageSize);

  return (
    <>
      <Stack sx={{ height: '84vh' }} p={0}>
        <ScrollArea
          p="xs"
          scrollbarSize={1}
          sx={{ height: '84vh' }}
          viewportRef={scrollViewRef}
        >
          {
            <Stack spacing={2}>
              {msgQuery.hasPreviousPage &&
              !msgQuery.isLoading &&
              !msgQuery.isFetchingPreviousPage &&
              initiallyScrolled ? (
                <div ref={intersection.ref} data-testid="div_chat_load_more" />
              ) : null}
              {msgQuery.data?.pages.map((page, index) => {
                return (
                  <Fragment key={page.items[0]?.id || index}>
                    {page.items.map((msg) => {
                      return (
                        <ChatMessage
                          message={msg}
                          key={msg.id}
                          deleteHandler={() =>
                            deleteMutation.mutateAsync({ id: msg.id })
                          }
                        />
                      );
                    })}
                  </Fragment>
                );
              })}
              <div ref={bottomRef}></div>
            </Stack>
          }
        </ScrollArea>
        <ChatInputBox
          addMessageHandler={(input) => addMessageMutation.mutateAsync(input)}
        />
      </Stack>
    </>
  );
};

export default ChatRoom;
