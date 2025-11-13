<p align="center">
  <a href="https://zeroqc.app">
    <img src="https://assets.zeroqc.app/logo-text.png" alt="zeroqc's logo" width="300" />
  </a>
</p>

<div align="center">


</div>

<div align="center">
  <h3>
    <a href="https://zeroqc.app/docs">Quick Start</a>
    <span> | </span>
    <a href="https://zeroqc.app">Website</a>
    <span> | </span>
    <a href="https://cloud.zeroqc.app">Cloud (free)</a>
    <span> | </span>
    <a href="https://discord.gg/rU4tSyhXXU">Discord</a>
  </h3>
</div>

<h1 align="center">All you need. Nothing you don't.</h1>

<p align="center">Project management that gets out of your way so you can focus on building great products.</p>

## Why zeroqc?

After years of using bloated, overcomplicated project management platforms that distracted from actual work, we built zeroqc to be different.

The problem with most tools isn't that they lack features—it's that they have **too many**. Every notification, every unnecessary button, every complex workflow pulls your team away from what matters: **building great products**.

We believe the best tools are **invisible**. They should amplify your team's natural workflow, not force you to adapt to theirs. zeroqc is built on the principle that **less is more**—every feature exists because it solves a real problem, not because it looks impressive in a demo.

**What makes it different:**
- **Clean interface** that focuses on your work, not the tool
- **Self-hosted** so your data stays yours
- **Actually fast** because we care about performance
- **Open source** and free forever

Learn more about zeroqc's features and capabilities in our [documentation](https://zeroqc.app/docs).

## Getting Started

### Quick Start with Docker Compose

The fastest way to try zeroqc is with Docker Compose. This sets up the API, web interface, and PostgreSQL database:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zeroqc -d zeroqc"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/usezeroqc/api:latest
    ports:
      - "1337:1337"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  web:
    image: ghcr.io/usezeroqc/web:latest
    ports:
      - "5173:5173"
    env_file:
      - .env
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

Save this as `compose.yml`, create a `.env` file with your configuration (see [Configuration Options](#configuration-options) below), run `docker compose up -d`, and open [http://localhost:5173](http://localhost:5173).

> **Important:** See our [full documentation](https://zeroqc.app/docs) for detailed setup instructions, environment variable configuration, and troubleshooting guides.

### Development Setup

For development, see our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

### Configuration Options

Here are the essential environment variables you'll need in your `.env` file:

| Variable | What it does | Default |
| -------- | ------------ | ------- |
| `ZEROQC_API_URL` | Where the web app finds the API | Required |
| `JWT_ACCESS` | Secret key for user authentication | Required |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `POSTGRES_DB` | PostgreSQL database name | `zeroqc` |
| `POSTGRES_USER` | PostgreSQL username | Required |
| `POSTGRES_PASSWORD` | PostgreSQL password | Required |
| `DISABLE_REGISTRATION` | Block new user signups | `true` |

For a complete list of configuration options and advanced settings, see the [full documentation](https://zeroqc.app/docs).

### Database Setup

zeroqc uses PostgreSQL for data storage. The Docker Compose setup above handles this automatically, but if you're running zeroqc outside of Docker, or if you are using an external postgres database, you'll need to:

1. **Install PostgreSQL** (version 12 or higher)
2. **Create a database and user:**
   ```sql
   CREATE DATABASE zeroqc;
   CREATE USER zeroqc_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE zeroqc TO zeroqc_user;

   \c zeroqc;
   GRANT USAGE ON SCHEMA public TO zeroqc_user;
   GRANT CREATE ON SCHEMA public TO zeroqc_user;
   ALTER SCHEMA public OWNER TO zeroqc_user;
   ```
3. **Set the DATABASE_URL environment variable:**
   ```bash
   export DATABASE_URL="postgresql://zeroqc_user:your_password@localhost:5432/zeroqc"
   ```

For more database configuration options and troubleshooting, visit the [documentation](https://zeroqc.app/docs).

## Kubernetes Deployment

If you're running Kubernetes, we provide a comprehensive Helm chart. Check out the [Helm chart documentation](./charts/zeroqc/README.md) for detailed installation instructions, production configuration examples, TLS setup, and more.

## Development

Want to hack on zeroqc? See our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

Quick start:
```bash
# Clone and install dependencies
git clone https://github.com/usezeroqc/zeroqc.git
cd zeroqc
pnpm install

# Copy environment files
cp apps/api/.env.sample apps/api/.env
cp apps/web/.env.sample apps/web/.env

# Update environment variables as needed
# See ENVIRONMENT_SETUP.md for detailed instructions

# Start development servers
pnpm dev
```

For contributing guidelines, code structure, and development best practices, check out our [contributing guide](CONTRIBUTING.md) and [documentation](https://zeroqc.app/docs).

## Community

- **[Discord](https://discord.gg/rU4tSyhXXU)** - Chat with users and contributors
- **[GitHub Issues](https://github.com/usezeroqc/zeroqc/issues)** - Bug reports and feature requests
- **[Documentation](https://zeroqc.app/docs)** - Detailed guides, API docs, and tutorials

## Contributing

We're always looking for help, whether that's:
- Reporting bugs or suggesting features
- Improving documentation
- Contributing code
- Helping other users on Discord

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for the details on how to get involved.

## License

MIT License - see [LICENSE](LICENSE) for details.

---