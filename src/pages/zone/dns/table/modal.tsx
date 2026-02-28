import { modals } from '@mantine/modals';
import { Box, Button, Group, Input, NativeSelect, NumberInput, Stack, Switch, TextInput, Textarea, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { currentlySupportedCloudflareDNSRecordTypes, useUpdateCloudflareDNSRecord, useDeleteCloudflareDNSRecord } from '@/lib/cloudflare/dns';
import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';

import { useStyles } from './table.styles';
import { IconCloudflare } from '@/components/icons/cloudflare';

interface DNSEditFormProps {
  record?: Cloudflare.DNSRecord | undefined | null,
  modalId: string
}

const SUPPORTED_DNS_RECORD_TYPES = Array.from(currentlySupportedCloudflareDNSRecordTypes);

// Helper functions to detect IP address types
const isIPv4 = (value: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(value.trim());
const isIPv6 = (value: string) => /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(value.trim()) || /^::1?$/.test(value.trim());

const DNSEditForm = memo(({ record, modalId }: DNSEditFormProps) => {
  const isCreate = !record;
  const { trigger, isMutating } = useUpdateCloudflareDNSRecord();

  const { cx, classes } = useStyles();

  const form = useForm<Cloudflare.CreateDNSRecord>({
    initialValues: {
      type: record?.type ?? 'A',
      name: record?.name ?? '',
      content: record?.content ?? '',
      ttl: record?.ttl ?? 1,
      proxied: record?.proxied ?? false,
      comment: record?.comment ?? ''
    }
  });

  // Track if user has manually changed the record type
  const userManuallyChangedType = useRef(false);

  const [autoTtl, setAutoTtl] = useState(record ? record.ttl === 1 : true);
  const handleAutoTtlChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const isAutoTtl = event.currentTarget.checked;
    if (isAutoTtl) {
      form.setFieldValue('ttl', 1);
    }
    setAutoTtl(isAutoTtl);
  }, [form]);

  // Handle type change - mark as manually changed
  const handleTypeChange: React.ChangeEventHandler<HTMLSelectElement> = useCallback((event) => {
    userManuallyChangedType.current = true;
    form.getInputProps('type').onChange(event);
  }, [form]);

  // Auto-detect record type based on content value
  const handleContentBlur: React.FocusEventHandler<HTMLInputElement> = useCallback((event) => {
    if (userManuallyChangedType.current) return;

    const value = event.currentTarget.value;
    if (!value) return;

    if (isIPv4(value)) {
      form.setFieldValue('type', 'A');
    } else if (isIPv6(value)) {
      form.setFieldValue('type', 'AAAA');
    } else {
      form.setFieldValue('type', 'CNAME');
    }
  }, [form]);

  const handleReset: React.FormEventHandler<HTMLFormElement> = useCallback((e) => {
    form.onReset(e);
    modals.close(modalId);
  }, [form, modalId]);

  return (
    <Box w="100%">
      <form
        onSubmit={form.onSubmit(values => {
          trigger(values, isCreate, record?.id).then((result) => {
            if (result) {
              modals.close(modalId);
            }
          }).catch((err) => {
            console.error(err);
          });
        })}
        onReset={handleReset}
      >
        <Stack>
          <NativeSelect
            label="Type"
            withAsterisk
            data={SUPPORTED_DNS_RECORD_TYPES}
            {...form.getInputProps('type')}
            onChange={handleTypeChange}
          />
          <TextInput
            label="Name"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Value"
            withAsterisk
            {...form.getInputProps('content')}
            onBlur={handleContentBlur}
          />
          <Group w="100%" grow>
            <NumberInput
              label="TTL"
              withAsterisk
              disabled={autoTtl}
              {...form.getInputProps('ttl')}
            />
            <Input.Wrapper required label="Auto TTL" withAsterisk>
              <Switch
                checked={autoTtl}
                onChange={handleAutoTtlChange}
              />
            </Input.Wrapper>
          </Group>
          <Input.Wrapper required label="Cloudflare CDN Proxy" withAsterisk>
            <Switch
              {...form.getInputProps('proxied', { type: 'checkbox' })}
              onLabel={<IconCloudflare
                width={20}
                height={20}
                className={cx(classes.proxiedIcon, classes.proxiedIconWhite)}
              />}
              offLabel={<IconCloudflare
                width={20}
                height={20}
                className={cx(classes.proxiedIcon, classes.proxiedIconInactive)}
              />}
              color="orange"
            />
          </Input.Wrapper>
          <Textarea
            label="Comment"
            placeholder="Add a comment for this record (optional)"
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps('comment')}
          />
          {
            useMemo(() => (
              <Group spacing="xs">
                <Button type="submit" loading={isMutating}>
                  Save
                </Button>
                <Button type="reset" variant="outline">
                  Cancel
                </Button>
              </Group>
            ), [isMutating])
          }
        </Stack>
      </form>
    </Box>
  );
});

const DNSModal = memo(({ record, modalId }: DNSEditFormProps) => {
  if (record?.type && !currentlySupportedCloudflareDNSRecordTypes.has(record.type)) {
    return (
      <Stack>
        <Text>
          Dashflare does not currently support creating or editing DNS records of type {record.type} yet!
        </Text>
        <Button onClick={() => modals.close(modalId)}>
          Close
        </Button>
      </Stack>
    );
  }

  return (
    <DNSEditForm record={record} modalId={modalId} />
  );
});

export function openEditDNSRecordModal(record?: Cloudflare.DNSRecord, isDuplicate = false) {
  const effectiveRecord = isDuplicate && record
    ? { ...record, id: undefined } as unknown as Cloudflare.DNSRecord | undefined
    : record;
  const isCreate = !record || isDuplicate;
  const modalId = `dns-record-modal-${isCreate ? 'create' : record?.id}`;

  return modals.open({
    centered: true,
    modalId,
    title: isCreate ? 'Add DNS Record' : 'Edit DNS Record',
    children: (
      <DNSModal record={isDuplicate ? effectiveRecord : record} modalId={modalId} />
    )
  });
}

const DeleteDNSRecordModal = memo(({ record, modalId }: { record: Cloudflare.DNSRecord, modalId: string }) => {
  const { trigger, isMutating } = useDeleteCloudflareDNSRecord();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the confirm button when modal opens
  useEffect(() => {
    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCancel = () => {
    modals.close(modalId);
  };

  const handleConfirm = () => {
    // Log full record to console for recovery
    console.log('[DNS] Deleted record:', JSON.stringify(record, null, 2));
    console.log(`[DNS] To recreate: type=${record.type} name=${record.name} content=${record.content} ttl=${record.ttl} proxied=${record.proxied}`);
    trigger(record.id);
    modals.close(modalId);
  };

  return (
    <Stack>
      <Text size="sm">
        Are you sure you want to delete your DNS record of {record.name}? This action is destructive and you will have
        to contact support to restore your data.
      </Text>

      <Group position="right">
        <Button loading={isMutating} variant="default" onClick={handleCancel}>
          Cancel
        </Button>

        <Button ref={confirmButtonRef} loading={isMutating} color="red" onClick={handleConfirm}>
          Confirm and Delete
        </Button>
      </Group>
    </Stack>
  );
});

export function openDeleteDNSRecordModal(record: Cloudflare.DNSRecord) {
  const modalId = `dns-delete-record-modal-${record.id}`;

  return modals.open({
    modalId,
    title: 'Delete DNS Record',
    centered: true,
    children: (
      <DeleteDNSRecordModal record={record} modalId={modalId} />
    )
  });
}
