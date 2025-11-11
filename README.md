<p align="center">
  <a href="https://www.vendure.io">
    <svg width=100 fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28" class="text-brand h-8"><path d="M10.746 12.685v9.263c0 .166.093.323.237.405l8.407 4.762c.302.17.671.17.973 0l8.407-4.762a.466.466 0 0 0 .237-.405v-9.263a.476.476 0 0 0-.714-.404l-7.93 4.49a.996.996 0 0 1-.973 0l-7.93-4.49a.476.476 0 0 0-.714.404Z" fill="currentColor"></path><path d="M8.893.75.486 5.51A.948.948 0 0 0 0 6.333v9.522c0 .167.092.324.237.405l8.176 4.633a.476.476 0 0 0 .714-.405v-8.982c0-.34.185-.655.487-.824l7.93-4.491a.463.463 0 0 0 0-.81L9.366.75a.48.48 0 0 0-.477 0h.003ZM30.86.74l8.407 4.76c.301.17.486.487.486.825v9.522a.47.47 0 0 1-.237.405l-8.176 4.633a.476.476 0 0 1-.714-.405v-8.982a.945.945 0 0 0-.486-.824l-7.93-4.491a.463.463 0 0 1 0-.81L30.386.742a.48.48 0 0 1 .477 0h-.003Z" fill="currentColor"></path></svg>
  </a>
  <a href="https://railway.app?referralCode=-Yg50p">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://railway.app/brand/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://railway.app/brand/logo-light.svg">
      <img alt="Railway logo" src="https://railway.app/brand/logo-light.svg" width=100>
    </picture>
  </a>
</p>

<h2 align="center">
  Vendure open source ecommerce platform<br>
  <a href="https://railway.app/template/6DeBLr?referralCode=-Yg50p">one-click deploy on railway!</a>
</h2>

<h1 align="center">
  Need help?<br>
  <a href="https://funkyton.com/vendure-tutorial/">Step by step tutorial, with screenshots</a>
</h1>





<p align="center">
This boilerplate consist of a complete setup, backend + admin dashboard & react storefront. Everything is connected, plug n' play when using the reailway deploy template</p>

<p align="center">
  <a href="https://github.com/vendure-ecommerce/vendure/blob/0b1dcb7b03ca127ac8e63540d61d13fbcc02ff9f/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
  <a href="https://www.vendure.io/community">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
</p>

# vendure-backend

### railway setup

Use one-click deploy template:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/6DeBLr?referralCode=-Yg50p)

Please change the value of environment variables: `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD`.

### local setup
- Rename `.env.template` ->  `.env`
- To connect to your online database, from local; copy the values of the envorinment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SCHEMA`
that has been auto-generated on railway, and add to your `.env`. Or use value for a local database.

### requirements
- **postgres database** (will be automatically generated if using the railway template)


### commands
`cd vendure-backend/`
`pnpm install` to install dependencies
`pnpm build` will compile the app.
`pnpm dev` will start the local development server with admin dashboard at: `localhost:3000/admin`
`pnpm start` will start the production backend server with admin dashboard at: `localhost:3000/admin`
`pnpm seed:once` will seed the database with initial data (run after first setup). This script automatically rebuilds native modules like bcrypt to ensure compatibility across different platforms.

### additional resources
- **Tutorial blog post**: [Vendure Tutorial on FunkyTon](https://funkyton.com/vendure-tutorial/)


### License

This project is licensed under the GPLv3 License. See the [LICENSE](LICENSE.md) file for details.
