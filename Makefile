.PHONY: lint

lint:
	cd frontend && npx prettier --write .
	cd frontend && pnpm eslint . --fix
	cd server && poetry run black .
	cd server && poetry run isort .
	cd server && poetry run autoflake --in-place --recursive .

start-frontend:
	cd frontend && pnpm dev

start-server:
	cd server && poetry run uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8080
