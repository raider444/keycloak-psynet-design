#!/bin/sh
set -eu
image="${1:?Usage: check-copy-image.sh IMAGE}"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
chmod 0755 "$scratch"
mkdir "$scratch/target" "$scratch/corrupt"
chmod 0777 "$scratch/target"
chmod 0755 "$scratch/corrupt"

# Check default and arbitrary non-root IDs, including directory traversal.
for identity in 1000:1000 100123:100123; do
  docker run --rm --read-only --cap-drop=ALL \
    --security-opt=no-new-privileges --user "$identity" \
    --volume "$scratch/target:/target" "$image"
  cmp dist_keycloak/psynet-keycloak-26.jar "$scratch/target/psynet-keycloak-26.jar"
  docker run --rm --read-only --cap-drop=ALL \
    --security-opt=no-new-privileges --user "$identity" \
    --volume "$scratch/target:/target:ro" --entrypoint /bin/sh "$image" \
    -c 'test "$(stat -c %a /target/psynet-keycloak-26.jar)" = 644'
  rm "$scratch/target/psynet-keycloak-26.jar"
done

# A checksum mismatch must fail before writing anything to the target.
cp dist_keycloak/psynet-keycloak-26.jar.sha256 "$scratch/corrupt/"
printf 'corrupted artifact\n' > "$scratch/corrupt/psynet-keycloak-26.jar"
chmod 0444 "$scratch/corrupt/"*
if docker run --rm --read-only --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --volume "$scratch/corrupt:/theme:ro" \
  --volume "$scratch/target:/target" "$image"; then
  echo 'ERROR: copy accepted an invalid checksum' >&2
  exit 1
fi
test ! -e "$scratch/target/psynet-keycloak-26.jar"
echo "PASS copy permissions and checksum rejection: $image"
