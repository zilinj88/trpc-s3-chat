import {
  ActionIcon,
  Box,
  FileButton,
  Group,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import React from 'react';
import { CircleX, Paperclip, Send, Trash } from 'tabler-icons-react';
import { MessageAddRequest, MessageAddResponse } from '~/utils/clientModels';
import { uploadFile } from '~/utils/upload';

interface Props {
  addMessageHandler: (input: MessageAddRequest) => Promise<MessageAddResponse>;
}

const ChatInputBox: React.FC<Props> = (props: Props) => {
  const [value, setValue] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);

  const onSendMessage = async () => {
    try {
      // Clear out the input box
      setValue('');
      setFile(null);

      const response = await props.addMessageHandler({
        content: value,
        hasImage: !!file,
      });

      if (file != null && response.uploadUrl != null) {
        try {
          notifications.show({
            id: 'load-data',
            loading: true,
            title: 'Uploading image',
            message: '',
            autoClose: false,
            withCloseButton: false,
          });
          await uploadFile(file, response.uploadUrl);
          notifications.hide('load-data');
        } catch (cause) {
          notifications.update({
            id: 'load-data',
            color: 'red',
            icon: <CircleX />,
            title: 'Error',
            message: 'Uploading image failed',
            autoClose: 2000,
          });
        }
      }
    } catch (cause) {
      // console.log(cause);
    }
  };

  return (
    <>
      <Stack sx={{ height: '8vh' }} justify="center" p={0}>
        <Group position="right" p="xs">
          <TextInput
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            sx={{ flexGrow: 1 }}
            placeholder="Type message here"
            rightSection={
              <FileButton onChange={setFile} accept="image/png,image/jpeg">
                {(props) => (
                  <ActionIcon {...props}>
                    <Paperclip />
                  </ActionIcon>
                )}
              </FileButton>
            }
            onKeyDown={
              !/\S/.test(value)
                ? undefined
                : value.length < 2
                ? undefined
                : getHotkeyHandler([['Enter', onSendMessage]])
            }
          />
          {file ? (
            <Group mx={-10} spacing={0}>
              <ActionIcon color="red" onClick={() => setFile(null)}>
                <Trash />
              </ActionIcon>
              <Box maw={150}>
                <Text truncate>{`${file.name}`}</Text>
              </Box>
            </Group>
          ) : null}
          <ActionIcon
            onClick={() => onSendMessage()}
            variant="hover"
            size="lg"
            disabled={
              !/\S/.test(value) ? true : value.length < 2 ? true : false
            }
          >
            <Send />
          </ActionIcon>
        </Group>
      </Stack>
    </>
  );
};

export default ChatInputBox;
