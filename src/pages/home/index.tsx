import { Stack, Title, Text, Skeleton, Button, Alert, Pagination, TextInput, Loader, Group, rem, Anchor, Table, Select, ActionIcon, Tooltip } from '@mantine/core';
import Disclaimer from '@/components/disclaimer';
import { memo, useCallback } from 'react';
import { useCloudflareZoneList } from '@/lib/cloudflare/zone-list';
import { IconAlertCircle, IconSearch, IconPin, IconPinFilled } from '@tabler/icons-react';
import { useUncontrolled } from 'foxact/use-uncontrolled';
import { Link } from 'react-router-dom';

import title from 'title';
import { generateAbsoluteURL } from '@/lib/url';
import { usePagination } from '@/hooks/use-pagination';
import { PAGE_SIZE_ARRAY } from '@/lib/constants';
import { usePinnedDomainsActions } from '@/context/pinned-domains';

const ZoneListLoading = memo(() => (
  <>
    <Skeleton h={18} my={4} width={160} />
    <Skeleton h={36} width={240} />
    <Skeleton h={240} />
  </>
));

interface PinButtonProps {
  zoneId: string,
  zoneName: string
}

const PinButton = memo(({ zoneId, zoneName }: PinButtonProps) => {
  const { addPinnedDomain, removePinnedDomain, isPinned } = usePinnedDomainsActions();
  const pinned = isPinned(zoneId);

  const handleClick = useCallback(() => {
    if (pinned) {
      removePinnedDomain(zoneId);
    } else {
      addPinnedDomain({ zoneId, zoneName });
    }
  }, [pinned, zoneId, zoneName, addPinnedDomain, removePinnedDomain]);

  return (
    <Tooltip label={pinned ? 'Unpin domain' : 'Pin domain'}>
      <ActionIcon
        variant="subtle"
        color={pinned ? 'yellow' : 'gray'}
        onClick={handleClick}
      >
        {pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
      </ActionIcon>
    </Tooltip>
  );
});

function ZoneList() {
  const { pagination, handlePageIndexChange, handlePageSizeChange } = usePagination({
    pageIndex: 1,
    pageSize: 20
  });

  const [searchQuery, handleCommitSearchQuery, searchInputRef] = useUncontrolled('');
  const { data, error, isLoading } = useCloudflareZoneList(pagination.pageIndex, pagination.pageSize, searchQuery);

  if (isLoading && !data) return <ZoneListLoading />;
  if (error) {
    return (
      <Text>Failed to load avaliable zones!</Text>
    );
  }

  const totalPage = data?.result_info?.total_pages;

  return (
    <>
      <Text fw={600}>Select a zone to start:</Text>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleCommitSearchQuery();
      }}
      >
        <Group>
          <TextInput
            ref={searchInputRef}
            placeholder="Search zones..."
            icon={
              isLoading && searchQuery
                ? <Loader size="xs" />
                : <IconSearch size={rem(16)} />
            }
          />
          <Button type="submit">Search</Button>
        </Group>
      </form>

      <Table verticalSpacing={8}>
        <thead>
          <tr>
            <th style={{ width: 40 }} />
            <th>Domain</th>
            <th>Status</th>
            <th>Provider</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.result.map((zone) => (
            <tr key={zone.id}>
              <td>
                <PinButton zoneId={zone.id} zoneName={zone.name} />
              </td>
              <td>
                <Anchor component={Link} to={`/${zone.id}/${zone.name}/dns`}>
                  {zone.name}
                </Anchor>
              </td>
              <td>{title(zone.status)}</td>
              <td>
                <Text truncate maw={256} title={zone.host?.name || 'Cloudflare'}>
                  {
                    zone.host?.website
                      ? <Anchor target="_blank" href={generateAbsoluteURL(zone.host.website)}>{zone.host.name}</Anchor>
                      : (zone.host?.name || 'Cloudflare')
                  }
                </Text>
              </td>
              <td>
                <Button compact variant="default" component={Link} to={`/${zone.id}/${zone.name}/dns`}>Enter</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {totalPage != null && totalPage > 1 && (
        <>
          <Pagination
            total={totalPage}
            value={pagination.pageIndex}
            onChange={handlePageIndexChange}
          />
          <Select
            size="sm"
            styles={{
              input: {
                height: 32,
                minHeight: 32
              }
            }}
            w={128}
            data={PAGE_SIZE_ARRAY}
            value={String(pagination.pageSize)}
            onChange={handlePageSizeChange}
          />
        </>
      )}

      <Alert icon={<IconAlertCircle size="1rem" />} title="Don't see your zone here?" color="yellow">
        Dashflare can only access zones you have selected when you created your API token.
      </Alert>
    </>
  );
}

export default function Homepage() {
  return (
    <Stack>
      <Title>Welcome to Dashflare!</Title>
      <ZoneList />
      <Disclaimer />
    </Stack>
  );
}
