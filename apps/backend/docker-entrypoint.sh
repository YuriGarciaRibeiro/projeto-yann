set -eu

python -m app.migrations

exec "$@"
