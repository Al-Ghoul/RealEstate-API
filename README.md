# RealEstate API

This is the back-end for [RealEstate-App](https://github.com/Al-Ghoul/RealEstate-App).

> 🚀 Explore the [Features](#features) or dive into the [API Documentation](#api-documentation).

[![Dev Workflow](https://github.com/Al-Ghoul/RealEstate-API/actions/workflows/dev.yaml/badge.svg?branch=develop)](https://github.com/Al-Ghoul/RealEstate-API/actions/workflows/dev.yaml)

## Motivation

This side project helps me learn, improve, and showcase my backend skills.

## Technologies

- [Express](https://expressjs.com/)
- [Drizzle](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

Tools & Bundlers:

- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/en/)
- [TypeScript](https://www.typescriptlang.org/)
- [Nix](https://nixos.org/)
- [Bun Tests](https://bun.sh/docs/cli/test)
- [CI/CD](https://github.com/resources/articles/devops/ci-cd)

## Features

### Main

- [x] Basic JWT Authentication (Register, Login, Logout)
- [x] Social Authentication (Google, Facebook)
- [x] User Profile (Update, Delete)
- [x] Property CRUD (Create, Read, Update, Delete)
- [x] Property Search (Filter, Sort, Pagination)
- [x] Chats (Realtime Messaging)
- [x] Full I18N Support for APIs (English, Arabic)

### Development

- [x] Smoke & Integration Tests
- [x] Logging, Compression, Error Handling
- [x] Linting, Formatting, Type Checks (TS & Zod)

## Extras

- [x] [Type checks CI/CD](...) – runs `tsc --noEmit`
- [x] [Linting CI/CD](...) – checks lint rules via `eslint`
- [x] [Integration tests CI/CD](...) – uses Bun tests to run & validate associated tests

## Installation

- Clone the repo: `git clone https://github.com/Al-Ghoul/RealEstate-API.git`
- Install dependencies: `bun install` (the project is in `/app`)
- Run the server: `bun run dev`

You'll need a postgres database to run the server.

You can apply the migrations using `bun run db:applymigrations`

## API Documentation

Swagger is used to document the API, the spec file is generated using `bun run generate:api-docs` and could be found in the repo at [/app/openapi-spec.yaml](/app/openapi-spec.yaml)

Instead of using the spec file, You can view the live API docs on [Swagger Editor](https://editor-next.swagger.io/?url=https://raw.githubusercontent.com/Al-Ghoul/RealEstate-API/refs/heads/develop/app/openapi-spec.yaml)

## License

This project is licensed under the **AGPLv3**. See [LICENSE](./LICENSE) for details.

**Commercial use requires a separate commercial license.** See [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md) for terms.

> 🛠️ Built with love for learning, and structured like production.
