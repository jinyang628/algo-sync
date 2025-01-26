# Algo Sync Chrome Extension

## Install Poetry

It is recommended to use Python virtual environment, so you don't pollute your system Python environment.

```bash
# Install dependencies
poetry install
```

```bash
# Activate Python virtual environment
eval "$(poetry env activate)"
```

## Set up environment variables

```bash
# Create .env file (by copying from .env.example)
cp .env.example .env
```

## Style Enforcement

```bash
npx prettier --check . --write
```

## Quick Start

To build the chrome extension, run the following command at the `frontend` directory and unpack the extension in Chrome:

```bash
pnpm i
pnpm build
```
