#!/bin/bash

# SplitTrip: runs the app locally with one command, `npm run local` (#33).
# Use it the first time and every time after. Each step checks first and is
# skipped when there is nothing to do, so a second run starts in seconds.
# Another port: `PORT=3001 npm run local`, or put PORT=3001 in .env.
set -e
cd "$(dirname "$0")/.."

# 1. Docker runs the database
if ! docker info >/dev/null 2>&1; then
    echo "Please start Docker Desktop first"
    exit 1
fi

# The container version (npm run start-container) keeps its database in the
# same postgres-data folder, so the two must not run at the same time
if [ -n "$(docker ps -q -f name=^spliit-db-1$)" ]; then
    echo "The SplitTrip containers from 'npm run start-container' are running."
    echo "Stop them first with: docker compose down"
    exit 1
fi

# 2. Settings file, made once and never overwritten
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# 3. Port: PORT=... on the command line wins, then PORT= in .env, then 3000.
# Checked before anything slow runs, so a busy port fails right away.
if [ -z "$PORT" ]; then
    PORT=$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | tr -d "\"' \r")
fi
PORT=${PORT:-3000}
if command -v lsof >/dev/null && lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $PORT is already used by another app."
    echo "Start SplitTrip on another port instead: PORT=3001 npm run local"
    exit 1
fi

# 4. Database
./scripts/start-local-db.sh

# 5. Packages: installed when missing, or when package-lock.json changed since
# the last install (a teammate added a package). `npm ci` installs exactly what
# package-lock.json lists and never edits it, so nobody gets a noisy diff. It
# also applies migrations and generates the Prisma client (see "postinstall").
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
    npm ci
    # Marks this install as up to date for the check above
    touch node_modules/.package-lock.json
else
    # 6. Database changes a teammate merged (new migrations, or new fields in
    # schema.prisma). Both are quick when nothing changed.
    npx prisma migrate deploy
    npx prisma generate
fi

# 7. The app
echo ""
echo "Starting SplitTrip at http://localhost:$PORT"
exec npx next dev -p "$PORT"
