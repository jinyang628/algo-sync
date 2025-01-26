# Algo Sync Server

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
black . # Check Python code style
isort . # Sort Python imports
```

## Quick Start

To spin up the server, run the following command at the `server` directory:

```bash
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8080 --env-file .env
```
