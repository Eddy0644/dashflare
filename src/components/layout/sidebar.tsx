import { memo, useMemo } from 'react';
import { Navbar, NavLink as MantineNavLink, rem, createStyles, Text, Group, Button, Anchor, Stack } from '@mantine/core';
import { Link, NavLink as ReactRouterNavLink, useLocation, useParams } from 'react-router-dom';
import type { Icon } from '@tabler/icons-react';
import { IconArrowLeft, IconPin } from '@tabler/icons-react';

import { homeNavLinks, zoneNavLinks } from '@/router';
import { usePinnedDomains } from '@/context/pinned-domains';

interface NavLinkProps {
  to: string,
  label: string,
  icon: Icon
}

const useStyles = createStyles({
  a: { textDecoration: 'none' }
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

const PinnedDomainsSection = memo(() => {
  const pinnedDomains = usePinnedDomains();

  if (pinnedDomains.length === 0) {
    return null;
  }

  return (
    <Navbar.Section p="md" sx={theme => ({ borderTop: `${rem(1)} solid ${theme.colors.gray[2]}` })}>
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
