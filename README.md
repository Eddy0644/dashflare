# Dashflare

An **unofficial** [Cloudflare](https://www.cloudflare.com/) dashboard built on top of [Cloudflare API](https://api.cloudflare.com).

> This website is an Unofficial control panel for Cloudflare™ and is not associated Cloudflare, Inc. in anyway.
>
> Cloudflare and the Cloudflare logo are trademarks and/or registered trademarks of Cloudflare, Inc. in the United States and other jurisdictions.

## Demo

https://dashflare.eddy.moe

## Features

- [x] List all available zones
- [x] Universal SSL
  - [x] Modify Universal SSL CA
  - [x] Update SSL verification methods (CNAME, HTTP, TXT)
- [ ] DNS
  - [x] List DNS records
  - [ ] Edit DNS records
    - [x] Support simple records (A, AAAA, TXT, CNAME)
    - [ ] Support LOC records
    - [ ] Support HTTPS records
    - [ ] Support MX records
    - [ ] Support SRV records
    - [ ] Support other records
  - [x] Delete DNS records
  - [x] Search / Filter DNS records
- [ ] Purge Cache with extra settings (Country, Vary, CORS Origin)
- [x] ETag
- [ ] Per Hostname TLS Settings (https://blog.cloudflare.com/introducing-per-hostname-tls-settings/)

## Techstack

- [React](https://react.dev)
- [React Router](https://reactrouter.com)
- [SWR](https://swr.vercel.app) - React Hooks for Data Fetching
- [Mantine](https://mantine.dev) - A fully featured React components library

## Build

```sh
git clone https://github.com/Eddy0644/dashflare
cd dashflare
pnpm i
pnpm dev # pnpm build
```

## Deployment

### GitHub Pages

1. Fork this repo
2. Enable GitHub Pages in repo settings (Source: GitHub Actions)
3. (Optional) Set `CLOUDFLARE_API_ENDPOINT` in repo secrets if using custom API proxy
4. Push to `master` branch to trigger deployment

> **Note:** Must deploy to root path (`username.github.io` or custom domain root). Subpath deployment (e.g. `/dashflare`) will break static resource loading.

### Cloudflare Pages / Vercel / Netlify

Standard static site deployment. Build command: `pnpm build`, output: `dist`.

## License

[MIT](./LICENSE)

----

**Dashflare** © [Sukka](https://github.com/SukkaW), Released under the [MIT](./LICENSE) License.
Authored and maintained by Sukka with help from contributors ([list](https://github.com/SukkaW/dashflare/graphs/contributors)).
Eddy0644 forked.


<p align="center">
  <a href="https://github.com/sponsors/SukkaW/">
    <img src="https://sponsor.cdn.skk.moe/sponsors.svg"/>
  </a>
</p>
