# RealEstate API

This is a WIP real state API.

## Motivation

The purpose of this API is to provide a backend for a real estate app. The app will allow users to search for properties, view property details, and make reservations for properties.

## Build status

[![Dev Workflow](https://github.com/Al-Ghoul/RealEstate-API/actions/workflows/dev.yaml/badge.svg?branch=develop)](https://github.com/Al-Ghoul/RealEstate-API/actions/workflows/dev.yaml)

## Screenshots

TODO

## Technologies

- [Express](https://expressjs.com/)
- [Drizzle](https://orm.drizzle.team/)

Tools & Bundlers:

- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/en/)
- [TypeScript](https://www.typescriptlang.org/)
- [Nix](https://nixos.org/)

## Features

TODO

## Installation

- Clone the repo: `git clone https://github.com/Al-Ghoul/RealEstate-API.git`
- Install dependencies: `bun install` (the project is in `/app`)
- Run the server: `bun run dev`

You'll need a postgres database to run the server.

You can apply the migrations using `bun run db:applymigrations`

## API Documentation

Swagger is used to document the API, the spec file is generated using `bun run build:docs` and could be found in the repo at [/app/openapi-spec.yaml](/app/openapi-spec.yaml)

Instead of using the spec file, you can see the docs directly on [Swagger Editor](https://editor-next.swagger.io/?url=https://raw.githubusercontent.com/Al-Ghoul/RealEstate-API/refs/heads/develop/app/openapi-spec.yaml)

## License

This project is licensed under the **AGPLv3**. See [LICENSE](./LICENSE) for details.

**Commercial use requires a separate commercial license.** See [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md) for terms.
