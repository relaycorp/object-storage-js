#!/bin/bash -x

set -o nounset
set -o errexit
set -o pipefail

CURRENT_DIR="$(dirname "${BASH_SOURCE[0]}")"

export COMPOSE_PROJECT_NAME='object-storage-functional-tests'
export COMPOSE_FILE="${CURRENT_DIR}/docker-compose.yml"

trap "docker-compose down --remove-orphans" INT TERM EXIT

docker-compose pull
docker-compose build

docker-compose up  --force-recreate  --detach
sleep 3s

exec jest --config jest.config.functional.js --runInBand --detectOpenHandles
