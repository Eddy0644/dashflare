import { Suspense, useCallback, useState, lazy } from 'react';
import {
  AppShell,
  Navbar,
  Header,
  Text,
  MediaQuery,
  Burger,
  useMantineTheme,
  useCss,
  Flex,
  UnstyledButton,
  Group,
  Loader,
  Center,
  Container,
  Skeleton,
  Box
} from '@mantine/core';
import { IconCloudflare } from '../icons/cloudflare';
import { Link, Outlet } from 'react-router-dom';
import { ModalsProvider } from '@mantine/modals';
import { useReactRouterIsMatch } from 'foxact/use-react-router-is-match';
import { useReactRouterEnableConcurrentNavigation } from 'foxact/use-react-router-enable-concurrent-navigation';

const HeaderContent = lazy(() => import('./header'));
const SidebarContent = lazy(() => import('./sidebar'));

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 220;

export default function Layout() {
  const theme = useMantineTheme();
  const [navbarMobileOpened, setNavbarMobileOpened] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const { css } = useCss();
  const toggleNavbarMobile = useCallback(() => setNavbarMobileOpened((o) => !o), []);
  const isMatchLogin = useReactRouterIsMatch('/login');

  useReactRouterEnableConcurrentNavigation();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <ModalsProvider>
      <AppShell
        navbarOffsetBreakpoint="sm"
        navbar={
          isMatchLogin
            ? undefined
            : (
              <Navbar p={0} hiddenBreakpoint="sm" hidden={!navbarMobileOpened} width={{ sm: sidebarWidth }}>
                <Suspense fallback={null}>
                  <SidebarContent />
                </Suspense>
                <Box
                  onMouseDown={handleMouseDown}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 4,
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor: isResizing ? theme.colors.blue[5] : 'transparent',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      backgroundColor: theme.colors.gray[4]
                    },
                    '@media (max-width: 768px)': {
                      display: 'none'
                    }
                  }}
                />
              </Navbar>
            )
        }
        header={
          <Header height={{ base: 50 }} p="md" zIndex={101}>
            <Flex h="100%" align="center" justify="space-between">
              {
                !isMatchLogin && (
                  <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                    <Burger
                      opened={navbarMobileOpened}
                      onClick={toggleNavbarMobile}
                      size="sm"
                      color={theme.colors.gray[6]}
                      mr="xl"
                    />
                  </MediaQuery>
                )
              }

              <UnstyledButton component={Link} to="/">
                <Group spacing="xs">
                  <IconCloudflare className={css({ width: 24, height: 24, color: theme.colors.orange[6] })} />
                  <Text fw={600} size="xl">Dashflare</Text>
                </Group>
              </UnstyledButton>

              <Suspense fallback={
                <Center w={66} px="sm">
                  <Skeleton radius="md" height={18} width={66} />
                </Center>
              }
              >
                <HeaderContent isMatchLogin={isMatchLogin} />
              </Suspense>
            </Flex>
          </Header>
        }
      >
        <Container size="xl">
          <Suspense
            fallback={
              <Center h="100%" w="100%">
                <Loader size="xl" />
              </Center>
            }
          >
            <Outlet />
          </Suspense>
        </Container>
      </AppShell>
    </ModalsProvider>
  );
}
