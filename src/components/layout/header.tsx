import { Group, UnstyledButton, rem, Menu, Box, Text, Tooltip, ActionIcon, Select } from '@mantine/core';
import type { SelectItem } from '@mantine/core';
import { IconBrandGithub, IconChevronDown, IconUserCircle } from '@tabler/icons-react';
import { DarkModeSwitch } from '../darkmode-switch-menu';
import { useDisclosure } from '@mantine/hooks';
import TokenViewer from '../token-modal';
import { useLogout } from '@/context/token';
import { memo, useMemo } from 'react';
import { useCloudflareApiRateLimit } from '@/lib/fetcher';
import { IconCloudflare, IconCloudflareZeroTrust, IconCloudflareWorkers, IconCloudflareR2 } from '../icons/cloudflare';
import { useCloudflareAccounts } from '@/lib/cloudflare/accounts';
import { useSelectedAccountId, useSelectedAccountActions } from '@/context/selected-account';

interface HeaderContentProps {
  isMatchLogin: boolean
}

function CloudflareRateLimit() {
  const count = useCloudflareApiRateLimit();
  return (
    <span>{count} / 1200</span>
  );
}

function AccountSelector() {
  const { data: accounts, isLoading } = useCloudflareAccounts();
  const selectedAccountId = useSelectedAccountId();
  const { setSelectedAccountId } = useSelectedAccountActions();

  const accountListData: SelectItem[] = useMemo(() => accounts?.flatMap(accountList => accountList.result.map(account => ({
    label: account.name,
    value: account.id
  }))) || [], [accounts]);

  return (
    <Select
      size="xs"
      placeholder={isLoading ? 'Loading...' : 'Select account'}
      disabled={isLoading}
      data={accountListData}
      value={selectedAccountId}
      onChange={setSelectedAccountId}
      clearable
      styles={{
        input: {
          minWidth: 150
        }
      }}
    />
  );
}

function HeaderContent({ isMatchLogin }: HeaderContentProps) {
  const [opened, { open, close }] = useDisclosure();
  const logout = useLogout();
  const selectedAccountId = useSelectedAccountId();

  const dashboardUrl = selectedAccountId
    ? `https://dash.cloudflare.com/${selectedAccountId}/home/domains`
    : 'https://dash.cloudflare.com/zones';

  const zeroTrustUrl = selectedAccountId
    ? `https://one.dash.cloudflare.com/${selectedAccountId}/overview`
    : 'https://one.dash.cloudflare.com/';

  const workersUrl = selectedAccountId
    ? `https://dash.cloudflare.com/${selectedAccountId}/workers-and-pages`
    : 'https://dash.cloudflare.com/';

  const r2Url = selectedAccountId
    ? `https://dash.cloudflare.com/${selectedAccountId}/r2/overview`
    : 'https://dash.cloudflare.com/';

  return (
    <>
      <Group spacing="xs">
        {!isMatchLogin && (
          <>
            <Tooltip label="Cloudflare Domains">
              <ActionIcon
                component="a"
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                size="lg"
              >
                <IconCloudflare width={20} height={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Cloudflare Zero Trust">
              <ActionIcon
                component="a"
                href={zeroTrustUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                size="lg"
              >
                <IconCloudflareZeroTrust width={20} height={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Workers & Pages">
              <ActionIcon
                component="a"
                href={workersUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                size="lg"
              >
                <IconCloudflareWorkers width={20} height={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="R2 Storage">
              <ActionIcon
                component="a"
                href={r2Url}
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                size="lg"
              >
                <IconCloudflareR2 width={20} height={20} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
        <Menu withinPortal>
          <Menu.Target>
            <UnstyledButton
              py="xs"
              px="sm"
              fw={500}
              fz="sm"
              lh={1}
              sx={theme => ({
                display: 'block',
                borderRadius: theme.radius.sm,
                color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],

                '&:hover': {
                  backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]
                }
              })}
            >
              <Group spacing="xs">
                <IconUserCircle size={rem(18)} />
                <IconChevronDown size={rem(14)} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>About</Menu.Label>
            <Menu.Item
              component="a"
              href="https://github.com/Eddy0644/dashflare"
              target="_blank"
              icon={<IconBrandGithub size={rem(18)} />}
            >
              Source Code
            </Menu.Item>

            <Menu.Label>Appearance</Menu.Label>
            <Box px="xs" mb="xs">
              <DarkModeSwitch />
            </Box>

            {!isMatchLogin && (
              <>
                <Menu.Label>Cloudflare Account</Menu.Label>
                <Box px="xs" mb="xs">
                  <AccountSelector />
                </Box>

                <Menu.Label>Cloudflare API Rate Limit</Menu.Label>
                <Box px="xs" mb="xs">
                  <Text size="sm">
                    Requests in last 5 minutes: <CloudflareRateLimit />
                  </Text>
                  <Text size="xs" color="gray" maw={256}>
                    The global rate limit for Cloudflare's API is 1200 requests per five minutes.
                  </Text>
                </Box>

                <Menu.Label>Account</Menu.Label>
                <Menu.Item onClick={open}>View Token</Menu.Item>
                <Menu.Item color="red" onClick={logout}>Log Out</Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
      {!isMatchLogin && <TokenViewer opened={opened} onClose={close} />}
    </>
  );
}

export default memo(HeaderContent);
