# doco-cd POC: Continuous Deployment for a Node.js REST API

This project demonstrates **continuous deployment** using [doco-cd](https://github.com/kimdre/doco-cd) with:

- **Docker Swarm** for orchestration
- **Traefik** as ingress and load balancer
- A **NestJS REST API** with a GET endpoint that returns time, hostname, and request duration
- **doco-cd** polling a remote GitHub repository and deploying the stack on changes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub (remote repo)                                            │
│  - Source + .doco-cd.yml + compose.yml (Traefik + API)          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ poll (interval)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  doco-cd (doco-cd-runner/)                                       │
│  - Clones repo, builds API image, deploys stack via Swarm        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ docker stack deploy
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Docker Swarm stack                                              │
│  - Traefik (port 80) → load balance to API replicas              │
│  - time-api (NestJS, 2 replicas)                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker Engine with [Swarm mode](https://docs.docker.com/engine/swarm/swarm-tutorial/create-swarm/) enabled
- `openssl` (for generating the self-signed certificate)
- (Optional) A GitHub repo (this repo or a fork) for doco-cd to poll; for public repos no token is required

**Note:** On Docker Engine 29+ (min API 1.44), Traefik must be v3.6 or newer. This stack uses `traefik:v3.6` for compatibility. Traefik is configured per the [official Swarm setup](https://doc.traefik.io/traefik/setup/swarm/).

## Quick start

### 1. Initialize Docker Swarm (if not already)

```bash
docker swarm init
```

If you see an error about multiple addresses (e.g. "could not choose an IP address to advertise"), pick the IP of the interface you want the swarm to use (often `eth0`) and run:

```bash
docker swarm init --advertise-addr 172.24.117.11
```

Replace `172.24.117.11` with your node’s IP (e.g. from `ip addr` or `hostname -I`).

### 2. Run doco-cd so it polls your GitHub repo

Copy the example env and set the repo URL:

```bash
cd doco-cd-runner
cp .env.example .env
# Edit .env: set POLL_REPO_URL to your repo, e.g. https://github.com/YOUR_USER/doco-cd-poc.git
```

Start doco-cd (it will poll and deploy the stack defined in the repo):

```bash
docker compose up -d
docker compose logs -f
```

After the first poll, doco-cd will clone the repo, build the API image, and deploy the Swarm stack (Traefik + API).

### 3. Add host entries for *.swarm.localhost

Traefik uses Host-based routing. Add to `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1 api.swarm.localhost dashboard.swarm.localhost
```

### 4. Call the API

The API is served over HTTPS at `api.swarm.localhost`:

```bash
curl -k https://api.swarm.localhost/
curl -k https://api.swarm.localhost/health
```

Example response:

```json
{
  "time": "2025-03-09T12:00:00.000Z",
  "hostname": "a1b2c3d4e5f6",
  "durationMs": 2
}
```

- **time**: server time (ISO 8601)
- **hostname**: container hostname (so you can see which replica answered when using multiple replicas)
- **durationMs**: time from request start to response (ms)

Use `-k` (or `--insecure`) to accept the self-signed certificate.

### 5. Traefik dashboard

Dashboard at **https://dashboard.swarm.localhost/** with basic-auth:

- Username: `admin`
- Password: `P@ssw0rd`

```bash
curl -k -u admin:P@ssw0rd https://dashboard.swarm.localhost/dashboard/
```

## Project layout

| Path | Purpose |
|------|--------|
| `api/` | NestJS app: GET `/` (time, hostname, duration), GET `/health` |
| `certs/` | Self-signed TLS certificate for `*.swarm.localhost` |
| `dynamic/` | Traefik dynamic config (TLS certificates) |
| `compose.yml` | Swarm stack: Traefik + API (per [Traefik Swarm setup](https://doc.traefik.io/traefik/setup/swarm/)) |
| `.doco-cd.yml` | doco-cd deploy config: stack name, compose file, build options |
| `doco-cd-runner/` | Compose to run doco-cd with poll config pointing at a remote GitHub repo |

## Configuring the poll target

In `doco-cd-runner/.env`:

- **POLL_REPO_URL** – HTTP or SSH clone URL of the repo (e.g. `https://github.com/user/doco-cd-poc.git`).
- **POLL_REF** – Branch or tag (default `refs/heads/main`).
- **POLL_INTERVAL** – Seconds between polls (default `120`).
- **GIT_ACCESS_TOKEN** – Optional; required for private repos, recommended for public repos to avoid rate limits.

After changing `.env`, restart doco-cd:

```bash
cd doco-cd-runner && docker compose up -d
```

## Local development (API only)

```bash
cd api
npm install
npm run start:dev
# GET http://localhost:3000/
```

## Deploying manually (without doco-cd)

From the repo root (with Swarm initialized):

```bash
# Create certs if missing (per Traefik Swarm docs)
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/local.key -out certs/local.crt \
  -subj "/CN=*.swarm.localhost"

# Build and deploy
docker compose -f compose.yml build
docker stack deploy -c compose.yml doco-cd-poc
```

To remove the stack:

```bash
docker stack rm doco-cd-poc
```

## References

- [Traefik Setup - Swarm](https://doc.traefik.io/traefik/setup/swarm/) – Official Traefik Swarm guide
- [doco-cd](https://github.com/kimdre/doco-cd) – GitOps-style CD for Docker Compose/Swarm
- [doco-cd Quickstart](https://github.com/kimdre/doco-cd/wiki/Quickstart)
- [doco-cd Poll Settings](https://github.com/kimdre/doco-cd/wiki/Poll-Settings)
- [doco-cd Swarm Mode](https://github.com/kimdre/doco-cd/wiki/Swarm-Mode)
