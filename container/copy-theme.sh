#!/bin/sh
set -eu
# The only writable path is the emptyDir mounted at the destination.
destination="${1:-/target}"
test -d "$destination" || { echo "Theme destination must be an existing mounted directory: $destination" >&2; exit 1; }
(cd /theme && sha256sum -c psynet-keycloak-26.jar.sha256)
cp /theme/psynet-keycloak-26.jar "$destination/psynet-keycloak-26.jar"
chmod 0644 "$destination/psynet-keycloak-26.jar"
echo "Installed PsyNet login themes into $destination/psynet-keycloak-26.jar"
