#!/bin/bash -x

set -o nounset
set -o errexit
set -o pipefail

CURRENT_DIR="$(dirname "${BASH_SOURCE[0]}")"

export COMPOSE_PROJECT_NAME='object-storage-functional-tests'
export COMPOSE_FILE="${CURRENT_DIR}/docker-compose.yml"

trap "docker-compose down --remove-orphans --volumes" INT TERM EXIT

docker-compose pull

docker-compose --env-file "$(pwd)/.env" up  --force-recreate  --detach
sleep 3s

docker-compose ps

if ! jest --config jest.config.integration.js --runInBand --detectOpenHandles ; then
  docker-compose logs gcs
fi
