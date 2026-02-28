import { Anchor, Box, Button, Group, ScrollArea, Table, Text, Tooltip } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { IconCloudflare } from '@/components/icons/cloudflare';
import { IconCopy, IconGitFork, IconSortAscending, IconSortDescending, IconX } from '@tabler/icons-react';
import type { PaginationState } from '@tanstack/react-table';
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStyles } from './table.styles';
import { openDeleteDNSRecordModal, openEditDNSRecordModal } from './modal';

const columnHelper = createColumnHelper<Cloudflare.DNSRecord>();
const EMPTY_ARRAY: Cloudflare.DNSRecord[] = [];

const NameCell = memo(({ name }: { name: string }) => {
  const { classes } = useStyles();
  const clipboard = useClipboard({ timeout: 2000 });

  const handleCopy = () => {
    clipboard.copy(name);
  };

  return (
    <Group spacing={4} noWrap>
      <Tooltip label={clipboard.copied ? 'Copied' : 'Copy'} position="bottom-start">
        <Button
          compact
          variant="subtle"
          size="xs"
          onClick={handleCopy}
          px={4}
          color={clipboard.copied ? 'green' : 'gray'}
        >
          <IconCopy size={14} />
        </Button>
      </Tooltip>
      <Tooltip label={name} position="bottom-start">
        <Anchor
          href={`https://${name}`}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.nameCell}
          truncate
          title={name}
        >
          {name}
        </Anchor>
      </Tooltip>
    </Group>
  );
});

const ValueCell = memo(({ value }: { value: string }) => {
  const { classes } = useStyles();
  const clipboard = useClipboard({ timeout: 2000 });

  const handleCopy = () => {
    clipboard.copy(value);
  };

  return (
    <Group spacing={4} noWrap>
      <Tooltip label={clipboard.copied ? 'Copied' : 'Copy'} position="bottom-start">
        <Button
          compact
          variant="subtle"
          size="xs"
          onClick={handleCopy}
          px={4}
          color={clipboard.copied ? 'green' : 'gray'}
        >
          <IconCopy size={14} />
        </Button>
      </Tooltip>
      <Tooltip label={value} position="bottom-start">
        <Text className={classes.valueCell} truncate title={value}>{value}</Text>
      </Tooltip>
    </Group>
  );
});

const CommentCell = memo(({ comment }: { comment: string | null | undefined }) => {
  const { classes } = useStyles();

  if (!comment) {
    return <Text c="dimmed">-</Text>;
  }

  return (
    <Tooltip label={comment} position="bottom-start">
      <Text className={classes.commentCell} truncate title={comment}>{comment}</Text>
    </Tooltip>
  );
});

const ProxiedCell = memo(({ proxied, proxiable }: Pick<Cloudflare.DNSRecord, 'proxied' | 'proxiable'>) => {
  const { cx, classes } = useStyles();

  if (!proxiable) {
    return (
      <Tooltip label="Not Proxiable">
        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconX size={18} className={classes.proxiedIconInactive} />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={proxied ? 'Proxied' : 'DNS Only'}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconCloudflare
          width={20}
          height={20}
          className={cx(classes.proxiedIcon, proxied ? classes.proxiedIconActive : classes.proxiedIconInactive)}
        />
      </Box>
    </Tooltip>
  );
});

interface ActionCellProps {
  record: Cloudflare.DNSRecord
}

const ActionCell = memo(({ record }: ActionCellProps) => {
  const isReadOnly = record.meta?.read_only === true;

  return (
    <Group align="center" spacing={0} noWrap>
      <Tooltip label="Duplicate">
        <Button
          compact
          variant="subtle"
          color="gray"
          onClick={useCallback(() => openEditDNSRecordModal(record, true), [record])}
          px={4}
        >
          <IconGitFork size={16} />
        </Button>
      </Tooltip>
      <Button
        compact
        variant="subtle"
        disabled={isReadOnly}
        onClick={useCallback(() => openEditDNSRecordModal(record), [record])}
      >
        Edit
      </Button>
      <Button
        compact
        variant="subtle"
        color="red"
        onClick={useCallback(() => openDeleteDNSRecordModal(record), [record])}
      >
        Delete
      </Button>
    </Group>
  );
});

// Sortable column IDs (excludes proxied and actions)
type SortableColumnId = 'name' | 'type' | 'content' | 'ttl' | 'comment';
type SortDirection = 'asc' | 'desc';
interface SortState {
  column: SortableColumnId | null;
  direction: SortDirection;
}

const SortableHeader = memo(({ label, columnId, sortState, onSort }: {
  label: string,
  columnId: SortableColumnId,
  sortState: SortState,
  onSort: (columnId: SortableColumnId) => void
}) => {
  const isActive = sortState.column === columnId;
  return (
    <Group spacing={2} noWrap sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(columnId)}>
      <Text>{label}</Text>
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 0, opacity: isActive ? 1 : 0.3 }}>
        {isActive && sortState.direction === 'asc'
          ? <IconSortAscending size={14} />
          : isActive && sortState.direction === 'desc'
            ? <IconSortDescending size={14} />
            : <IconSortAscending size={14} />
        }
      </Box>
    </Group>
  );
});

function getColumns(sortState: SortState, onSort: (columnId: SortableColumnId) => void) {
  return [
    columnHelper.accessor('proxied', {
      header: 'CDN',
      cell(props) {
        const proxied = props.getValue();
        const proxiable = props.row.original.proxiable;
        return (
          <ProxiedCell proxied={proxied} proxiable={proxiable} />
        );
      },
      size: 48,
      minSize: 48,
      maxSize: 56
    }),
    columnHelper.accessor('name', {
      header: () => <SortableHeader label="Name" columnId="name" sortState={sortState} onSort={onSort} />,
      cell(props) {
        return <NameCell name={props.getValue()} />;
      },
      size: 112,
      minSize: 112,
      maxSize: 240
    }),
    columnHelper.accessor('type', {
      header: () => <SortableHeader label="Type" columnId="type" sortState={sortState} onSort={onSort} />,
      cell(props) {
        const meta = props.row.original.meta;
        if (meta?.origin_worker_id) {
          return 'Worker';
        }
        return props.getValue();
      },
      size: 48,
      minSize: 48,
      maxSize: 56
    }),
    columnHelper.accessor('content', {
      header: () => <SortableHeader label="Value" columnId="content" sortState={sortState} onSort={onSort} />,
      cell(props) {
        const meta = props.row.original.meta;
        if (meta?.origin_worker_id) {
          return <Text c="dimmed">-</Text>;
        }
        return <ValueCell value={props.getValue()} />;
      },
      size: 280,
      minSize: 240,
      maxSize: 340
    }),
    columnHelper.accessor('ttl', {
      header: () => <SortableHeader label="TTL" columnId="ttl" sortState={sortState} onSort={onSort} />,
      cell(props) {
        const ttl = props.renderValue();
        return ttl === 1 ? 'Auto' : ttl;
      },
      size: 64,
      minSize: 64,
      maxSize: 72
    }),
    columnHelper.accessor('comment', {
      header: () => <SortableHeader label="Comment" columnId="comment" sortState={sortState} onSort={onSort} />,
      cell(props) {
        return <CommentCell comment={props.getValue()} />;
      },
      size: 160,
      minSize: 120,
      maxSize: 240
    }),
    columnHelper.display({
      id: 'actions',
      // size: 128,
      minSize: 148,
      maxSize: 180,
      meta: {
        isFixed: true
      },
      cell(props) {
        return (
          <ActionCell record={props.row.original} />
        );
      }
    })
  ];
}

interface DNSDataTableProps {
  data: Cloudflare.DNSRecord[],
  pageCount: number,
  pagination: PaginationState
}

// Type priority for sorting: A/AAAA/CNAME first (0), Worker middle (0.5), MX/NS/TXT/others last (1)
const TYPE_PRIORITY: Record<string, number> = {
  A: 0, AAAA: 0, CNAME: 0,
  Worker: 0.5,
  MX: 1, NS: 1, TXT: 1, SPF: 1, SRV: 1
};

function getTypePriority(type: string, meta?: Cloudflare.DNSRecord['meta']): number {
  if (meta?.origin_worker_id) return TYPE_PRIORITY.Worker;
  return TYPE_PRIORITY[type] ?? 1;
}

// Comparator for a specific column
function compareByColumn(a: Cloudflare.DNSRecord, b: Cloudflare.DNSRecord, column: SortableColumnId, direction: SortDirection): number {
  let cmp = 0;
  switch (column) {
    case 'name':
      cmp = a.name.localeCompare(b.name);
      break;
    case 'type': {
      const typeA = a.meta?.origin_worker_id ? 'Worker' : a.type;
      const typeB = b.meta?.origin_worker_id ? 'Worker' : b.type;
      cmp = typeA.localeCompare(typeB);
      break;
    }
    case 'content':
      cmp = a.content.localeCompare(b.content);
      break;
    case 'ttl':
      cmp = a.ttl - b.ttl;
      break;
    case 'comment':
      cmp = (a.comment ?? '').localeCompare(b.comment ?? '');
      break;
  }
  return direction === 'desc' ? -cmp : cmp;
}

const DNSDataTable = memo(({
  data,
  pageCount,
  pagination
}: DNSDataTableProps) => {
  const tableElementRef = useRef<HTMLTableElement>(null);
  const containerElementRef = useRef<HTMLDivElement>(null);
  const containerViewportRef = useRef<HTMLDivElement>(null);

  const [isRightColumnFixed, setIsRightColumnFixed] = useState(false);
  const [isReachRightEndOfScrollArea, setIsReachRightEndOfScrollArea] = useState(false);
  useEffect(() => {
    const containerElement = containerElementRef.current;
    const tableElement = tableElementRef.current;
    const observer = new ResizeObserver((entries) => {
      if (tableElement && containerElement) {
        const containerWidth = entries[0].contentRect.width;
        const tableElementWidth = tableElement.getBoundingClientRect().width;
        const isRightColumnFixed = containerWidth < tableElementWidth;

        setIsRightColumnFixed(isRightColumnFixed);
      }
    });

    if (containerElement) {
      observer.observe(containerElement);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const { cx, classes } = useStyles();

  // Sort state: null column means use default sort
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' });

  const handleSort = useCallback((columnId: SortableColumnId) => {
    setSortState(prev => {
      if (prev.column === columnId) {
        // Cycle: asc -> desc -> reset to default
        if (prev.direction === 'asc') return { column: columnId, direction: 'desc' };
        return { column: null, direction: 'asc' };
      }
      return { column: columnId, direction: 'asc' };
    });
  }, []);

  const tableColumns = useMemo(() => getColumns(sortState, handleSort), [sortState, handleSort]);

  // Sort data: use user-selected column, or default sort
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return data || EMPTY_ARRAY;
    return [...data].sort((a, b) => {
      if (sortState.column) {
        return compareByColumn(a, b, sortState.column, sortState.direction);
      }
      // Default sort: type group -> content -> type -> name
      const groupA = getTypePriority(a.type, a.meta);
      const groupB = getTypePriority(b.type, b.meta);
      if (groupA !== groupB) return groupA - groupB;
      const contentCmp = a.content.localeCompare(b.content);
      if (contentCmp !== 0) return contentCmp;
      const typeCmp = a.type.localeCompare(b.type);
      if (typeCmp !== 0) return typeCmp;
      return a.name.localeCompare(b.name);
    });
  }, [data, sortState]);

  const table = useReactTable({
    // https://github.com/TanStack/table/discussions/4179#discussioncomment-3631326
    defaultColumn: {
      minSize: 0,
      size: 0
    },
    data: sortedData,
    pageCount,
    state: { pagination },
    manualPagination: true,
    // onPaginationChange: setPagination,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel()
  });

  const handleScrollAreaPositionChange = useCallback((position: {
    x: number,
    y: number
  }) => {
    const containerElement = containerViewportRef.current;
    if (containerElement) {
      setIsReachRightEndOfScrollArea(
        containerElement.getBoundingClientRect().width + position.x + 1 >= containerElement.scrollWidth
      );
    }
  }, []);

  return (
    <ScrollArea
      sx={{
        maxWidth: '100%',
        overflowX: 'scroll',
        overflowY: 'hidden'
      }}
      styles={{
        scrollbar: {
          zIndex: 100
        }
      }}
      ref={containerElementRef}
      viewportRef={containerViewportRef}
      onScrollPositionChange={handleScrollAreaPositionChange}
    // offsetScrollbars
    // type="always"
    >
      <Table
        // withBorder
        w="100%"
        ref={tableElementRef}
        className={classes.table}
      >
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className={classes.cellBg}>
              {headerGroup.headers.map(header => {
                const headerWidth = header.getSize();
                return (
                  <th
                    key={header.id}
                    style={{ width: headerWidth === 0 ? undefined : headerWidth, userSelect: 'none' }}
                    colSpan={header.colSpan}
                    className={cx(
                      classes.cellBg,
                      header.column.columnDef.meta?.isFixed && classes.fixedRightColumn,
                      isRightColumnFixed && header.column.columnDef.meta?.isFixed && !isReachRightEndOfScrollArea && classes.fixedRightColumnActive
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <Box sx={{ whiteSpace: 'nowrap' }}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </Box>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => {
                const cellWidth = cell.column.getSize();

                return (
                  <td
                    key={cell.id}
                    style={{ width: cellWidth === 0 ? undefined : cellWidth }}
                    className={cx(
                      classes.cellBg,
                      cell.column.columnDef.meta?.isFixed && classes.fixedRightColumn,
                      isRightColumnFixed && cell.column.columnDef.meta?.isFixed && !isReachRightEndOfScrollArea && classes.fixedRightColumnActive
                    )}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </ScrollArea>
  );
});

export default DNSDataTable;
