Email bodies are adapted from Keycloak 26.0.8, Apache-2.0.
Source: https://github.com/keycloak/keycloak/tree/26.0.8/themes/src/main/resources/theme/base/email
HTML layout is original PsyNet work. Native message keys, sanitization, action URLs and expiration arguments are preserved. New server email types fall back to parent=keycloak, using the PsyNet HTML layout when they import template.ftl.
