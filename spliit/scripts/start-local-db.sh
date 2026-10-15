#!/bin/bash

# Starts the local PostgreSQL container (spliit-db) that `npm run dev` connects
# to. Creates it the first time, restarts it if it was stopped (after a reboot,
# for example), and waits until it accepts connections.
cd "$(dirname "$0")/.."

# Exact-name filters, so a container like spliit-db-1 from `npm run start-container` doesn't count
if [ -n "$(docker ps -q -f name=^spliit-db$)" ]; then
    echo "postgres is already running, doing nothing"
elif [ -n "$(docker ps -aq -f name=^spliit-db$)" ]; then
    echo "postgres is stopped, starting it"
    docker start spliit-db >/dev/null || exit 1
else
    echo "postgres is not running, starting it"
    mkdir -p postgres-data
    docker run --name spliit-db -d -p 5432:5432 -e POSTGRES_PASSWORD=1234 -v "/$(pwd)/postgres-data:/var/lib/postgresql" postgres >/dev/null || exit 1
fi

# Checked over TCP: on the very first start, postgres runs a temporary server on
# a local socket only, then restarts, so a socket check could pass too early.
for _ in $(seq 1 30); do
    if docker exec spliit-db pg_isready -h localhost -U postgres >/dev/null 2>&1; then
        exit 0
    fi
    sleep 1
done
echo "postgres did not start within 30 seconds. See what went wrong with: docker logs spliit-db"
exit 1
