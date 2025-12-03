import { memo, useMemo } from 'react';
import { Navbar, NavLink as MantineNavLink, rem, createStyles, Text, Group, Button, Anchor, Stack, Box } from '@mantine/core';
import { Link, NavLink as ReactRouterNavLink, useLocation, useParams } from 'react-router-dom';
import type { Icon } from '@tabler/icons-react';
import { IconArrowLeft, IconPin, IconExternalLink } from '@tabler/icons-react';

import { homeNavLinks, zoneNavLinks } from '@/router';
import { usePinnedDomains } from '@/context/pinned-domains';
import { useSelectedAccountId } from '@/context/selected-account';
import { IconCloudflare, IconCloudflareZeroTrust, IconCloudflareWorkers, IconCloudflareR2 } from '../icons/cloudflare';

interface NavLinkProps {
  to: string,
  label: string,
  icon: Icon
}

const useStyles = createStyles({
  a: { textDecoration: 'none' },
  externalLink: {
    textDecoration: 'none',
    display: 'block'
  }
});

const NavLink = memo(({
  to,
  label,
  icon: Icon
}: NavLinkProps) => {
  const { classes } = useStyles();

  return (
    <ReactRouterNavLink
      className={classes.a}
      to={to}
      end
    >
      {({ isActive }) => (
        <MantineNavLink
          label={<Text fw={isActive ? 600 : 400}>{label}</Text>}
          variant="filled"
          active={isActive}
          icon={
            <Icon size={rem(16)} />
          }
        />
      )}
    </ReactRouterNavLink>
  );
});

interface ExternalNavLinkProps {
  href: string,
  label: string,
  icon: React.ReactNode
}

const ExternalNavLink = memo(({ href, label, icon }: ExternalNavLinkProps) => {
  const { classes } = useStyles();

  return (
    <a
      className={classes.externalLink}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MantineNavLink
        label={
          <Group spacing={4} noWrap>
            <Text fw={400}>{label}</Text>
            <IconExternalLink size={rem(12)} style={{ opacity: 0.5 }} />
          </Group>
        }
        variant="subtle"
        icon={icon}
      />
    </a>
  );
});

const ExternalLinksSection = memo(() => {
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
    <Box mt="md">
      <Text size="xs" fw={600} c="dimmed" mb={4} px={rem(12)}>Cloudflare Console</Text>
      <ExternalNavLink
        href={dashboardUrl}
        label="Domains"
        icon={<IconCloudflare width={16} height={16} />}
      />
      <ExternalNavLink
        href={zeroTrustUrl}
        label="Zero Trust"
        icon={<IconCloudflareZeroTrust width={16} height={16} />}
      />
      <ExternalNavLink
        href={workersUrl}
        label="Workers & Pages"
        icon={<IconCloudflareWorkers width={16} height={16} />}
      />
      <ExternalNavLink
        href={r2Url}
        label="R2 Storage"
        icon={<IconCloudflareR2 width={16} height={16} />}
      />
    </Box>
  );
});

const PinnedDomainsSection = memo(() => {
  const pinnedDomains = usePinnedDomains();

  if (pinnedDomains.length === 0) {
    return null;
  }

  return (
    <Navbar.Section p="md" pb="xl" sx={theme => ({ borderTop: `${rem(1)} solid ${theme.colors.gray[2]}` })}>
      <Group spacing="xs" mb="xs">
        <IconPin size={rem(14)} />
        <Text size="sm" fw={600} c="dimmed">Pinned Domains</Text>
      </Group>
      <Stack spacing={4}>
        {pinnedDomains.map(domain => (
          <Anchor
            key={domain.zoneId}
            component={Link}
            to={`/${domain.zoneId}/${domain.zoneName}/dns`}
            size="sm"
            truncate
            title={domain.zoneName}
          >
            {domain.zoneName}
          </Anchor>
        ))}
      </Stack>
    </Navbar.Section>
  );
});

function SidebarContent() {
  // const isTokenActive = useIsCloudflareApiTokenValid();
  const { zoneId, zoneName } = useParams();
  // if (!isTokenActive || !zoneId || !zoneName) return null;
  const { pathname } = useLocation();

  return (
    <>
      {
        zoneName && (
          <Navbar.Section p="md" sx={theme => ({ borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}` })}>
            <Group spacing="sm">
              <Button component={Link} to="/" variant="subtle" p={8}>
                <IconArrowLeft size={rem(24)} />
              </Button>

              <Text fw={600} size="lg">{zoneName}</Text>
            </Group>
          </Navbar.Section>
        )
      }
      <Navbar.Section p="md" grow>
        {useMemo(() => {
          if (pathname === '/' || zoneId == null) {
            return (
              <>
                {homeNavLinks.map((link) => (
                  <NavLink
                    key={link.index ? '/' : link.path!}
                    to={link.index ? '/' : link.path!}
                    label={link.label}
                    icon={link.icon}
                  />
                ))}
                <ExternalLinksSection />
              </>
            );
          }

          return (
            <>
              {zoneNavLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={
                    link.path === ''
                      ? `/${zoneId}/${zoneName}`
                      : `/${zoneId}/${zoneName}/${link.path}`
                  }
                  label={link.label}
                  icon={link.icon}
                />
              ))}
            </>
          );
        }, [pathname, zoneId, zoneName])}
      </Navbar.Section>
      <PinnedDomainsSection />
    </>
  );
}

export default memo(SidebarContent);
