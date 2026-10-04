#!/usr/bin/env python3
"""Check the Keycloak theme artifact before it is shipped in the copy image."""
from pathlib import Path
import hashlib
import json
import zipfile

jar = Path('dist_keycloak/psynet-keycloak-26.jar')
with zipfile.ZipFile(jar) as archive:
    bad_file = archive.testzip()
    if bad_file:
        raise SystemExit(f'Corrupt ZIP entry: {bad_file}')
    metadata = json.loads(archive.read('META-INF/keycloak-themes.json'))
    actual = {entry['name']: entry['types'] for entry in metadata['themes']}
    expected = {'psynet-light': ['login'], 'psynet-dark': ['login']}
    if actual != expected:
        raise SystemExit(f'Unexpected themes: {actual}')
    names = archive.namelist()
    for theme in expected:
        prefix = f'theme/{theme}/login/'
        for page in ('login.ftl', 'register.ftl', 'login-reset-password.ftl', 'login-otp.ftl', 'theme.properties'):
            if prefix + page not in names:
                raise SystemExit(f'Missing {prefix + page}')
        for suffix in ('.webp', '.woff2', '.svg', '.css', '.js'):
            if not any(name.startswith(prefix + 'resources/') and name.endswith(suffix) for name in names):
                raise SystemExit(f'Missing {suffix} assets for {theme}')
checksum = hashlib.sha256(jar.read_bytes()).hexdigest()
jar.with_suffix('.jar.sha256').write_text(f'{checksum}  {jar.name}\n')
print(f'Validated {jar.name}: {jar.stat().st_size:,} bytes, SHA256 {checksum}')
