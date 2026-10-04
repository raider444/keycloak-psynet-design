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
    expected = {name: ['login', 'account', 'admin', 'email'] for name in ('psynet-light', 'psynet-dark')}
    if actual != expected:
        raise SystemExit(f'Unexpected themes: {actual}')
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise SystemExit('Duplicate ZIP entries')
    for theme in expected:
        prefix = f'theme/{theme}/login/'
        for page in ('login.ftl', 'register.ftl', 'login-reset-password.ftl', 'login-otp.ftl', 'theme.properties'):
            if prefix + page not in names:
                raise SystemExit(f'Missing {prefix + page}')
        for suffix in ('.webp', '.woff2', '.svg', '.css', '.js'):
            if not any(name.startswith(prefix + 'resources/') and name.endswith(suffix) for name in names):
                raise SystemExit(f'Missing {suffix} assets for {theme}')
        for kind, parent in (('account', 'keycloak.v3'), ('admin', 'keycloak.v2')):
            prefix = f'theme/{theme}/{kind}/'
            properties = archive.read(prefix + 'theme.properties').decode()
            assert f'parent={parent}' in properties
            assert prefix + 'index.ftl' not in names, 'Consoles must inherit native server entrypoints'
            for asset in ('console.css', 'psy-palette.css', 'appearance.js', 'psynet-logo.png',
                          'emblem.svg', 'forest.webp', 'PsyNet-Sans.woff2', 'PsyNet-Circuit.woff2', 'FONT-LICENSE.txt'):
                assert prefix + 'resources/' + asset in names, f'Missing {kind}/{asset}'
        prefix = f'theme/{theme}/email/'
        html_pages = {n.removeprefix(prefix+'html/') for n in names if n.startswith(prefix+'html/') and n.endswith('.ftl')}
        text_pages = {n.removeprefix(prefix+'text/') for n in names if n.startswith(prefix+'text/') and n.endswith('.ftl')}
        assert html_pages - {'template.ftl'} == text_pages, 'Every email needs HTML and text variants'
        assert {'password-reset.ftl', 'email-verification.ftl', 'executeActions.ftl', 'identity-provider-link.ftl', 'org-invite.ftl'} <= text_pages
        layout = archive.read(prefix+'html/template.ftl').decode()
        assert 'role="presentation"' in layout and 'style=' in layout and '<#nested>' in layout
        assert '<script' not in layout and '@SURFACE@' not in layout
        assert prefix+'resources/psynet-logo.png' in names
        assert prefix+'resources/FONT-LICENSE.txt' in names
checksum = hashlib.sha256(jar.read_bytes()).hexdigest()
jar.with_suffix('.jar.sha256').write_text(f'{checksum}  {jar.name}\n')
print(f'Validated {jar.name}: {jar.stat().st_size:,} bytes, SHA256 {checksum}')
