#!/usr/bin/env python3
"""Merge native console/email themes into the Keycloakify JAR, without duplicates.

Console JS and index.ftl are inherited from the installed Keycloak 26.x server.
Only our assets, styles and email templates are added. No network at build time.
"""
from pathlib import Path
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
JAR = ROOT / 'dist_keycloak/psynet-keycloak-26.jar'
PALETTES = {
    'light': dict(BACKGROUND='#eeedf5', SURFACE='#f6f5fa', FIELD='#ffffff', TEXT='#202739', MUTED='#566178', LINE='#a1adc0', ACCENT='#365ec7'),
    'dark': dict(BACKGROUND='#0b1523', SURFACE='#101821', FIELD='#17222e', TEXT='#f4f6fb', MUTED='#b4c0d2', LINE='#45566b', ACCENT='#80e7df'),
}

def render(data, scheme):
    text = data.decode()
    for key, value in dict(PALETTES[scheme], SCHEME=scheme).items():
        text = text.replace(f'@{key}@', value)
    return text.encode()

with zipfile.ZipFile(JAR) as archive:
    entries = {item.filename: archive.read(item) for item in archive.infolist() if not item.is_dir()}
metadata = json.loads(entries['META-INF/keycloak-themes.json'])
assert {t['name'] for t in metadata['themes']} == {'psynet-light', 'psynet-dark'}
for theme in metadata['themes']:
    scheme = theme['name'].removeprefix('psynet-')
    theme['types'] = ['login', 'account', 'admin', 'email']
    base = f"theme/{theme['name']}/"
    # Rebuilding an already augmented archive replaces our entries, never appends.
    entries = {n: d for n, d in entries.items() if not any(n.startswith(base+t+'/') for t in ('account','admin','email'))}
    for kind, parent in (('account','keycloak.v3'), ('admin','keycloak.v2')):
        prefix = base + kind + '/'
        entries[prefix+'theme.properties'] = (
            f'parent={parent}\nimport=common/keycloak\nstyles=psy-palette.css console.css\n'
            'scripts=appearance.js\ndarkMode=false\n'
            'logo=/psynet-logo.png\nfavIcon=/emblem.svg\nfavIconType=image/svg+xml\n'
            f'title=PsyNet · {kind.title()}\n'
        ).encode()
        entries[prefix+'resources/console.css'] = (ROOT/'theme-src/console/console.css').read_bytes()
        tokens = ''.join(f'--psy-{k.lower()}:{v};' for k, v in PALETTES[scheme].items())
        entries[prefix+'resources/psy-palette.css'] = f':root{{--psy-color-scheme:{scheme};{tokens}}}\n'.encode()
        entries[prefix+'resources/appearance.js'] = (
            f'document.documentElement.dataset.psynetAppearance="{scheme}";\n'
            f'document.documentElement.classList.toggle("pf-v5-theme-dark", {str(scheme=="dark").lower()});\n'
        ).encode()
        for name in ('emblem.svg','forest.webp','PsyNet-Sans.woff2','PsyNet-Circuit.woff2','FONT-LICENSE.txt'):
            entries[prefix+'resources/'+name] = (ROOT/'src/login/assets'/name).read_bytes()
        entries[prefix+'resources/psynet-logo.png'] = (ROOT/'theme-src/brand/psynet-logo.png').read_bytes()
    prefix = base+'email/'
    entries[prefix+'theme.properties'] = b'parent=keycloak\n'
    for file in sorted((ROOT/'theme-src/email').rglob('*')):
        if file.is_file():
            entries[prefix+file.relative_to(ROOT/'theme-src/email').as_posix()] = render(file.read_bytes(), scheme)
    for name in ('PsyNet-Circuit.woff2', 'FONT-LICENSE.txt'):
        entries[prefix+'resources/'+name] = (ROOT/'src/login/assets'/name).read_bytes()
    entries[prefix+'resources/psynet-logo.png'] = (ROOT/'theme-src/brand/psynet-logo.png').read_bytes()
entries['META-INF/keycloak-themes.json'] = json.dumps(metadata, indent=2).encode()
# Stable ordering/timestamps for the added packaging stage.
staged = JAR.with_suffix('.jar.tmp')
with zipfile.ZipFile(staged, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in sorted(entries.items()):
        item = zipfile.ZipInfo(name, date_time=(2024,1,1,0,0,0))
        item.compress_type = zipfile.ZIP_DEFLATED
        item.external_attr = 0o100644 << 16
        archive.writestr(item, data)
staged.replace(JAR)
print('Packaged login, account, admin and HTML/text email themes in both schemes')
