# Build the JAR on the host/CI first: npm run build-keycloak-theme
# The final image is an artifact copier, not a Keycloak server.
FROM busybox:1.37.0-musl@sha256:5cec3fc171c87218698e85a52af7087de727372aae264a787b8112901a5b0092
LABEL org.opencontainers.image.title="PsyNet Keycloak theme installer" \
      org.opencontainers.image.description="Light/dark Keycloak 26.x login, account, admin and email theme JAR for an init-container" \
      org.opencontainers.image.source="https://github.com/raider444/keycloak-psynet-design"
COPY --chmod=0444 dist_keycloak/psynet-keycloak-26.jar dist_keycloak/psynet-keycloak-26.jar.sha256 /theme/
# COPY --chmod can also affect the created destination directory in BuildKit.
# Every non-root UID needs traversal; the artifacts remain read-only (0444).
RUN chmod 0555 /theme
COPY --chmod=0555 container/copy-theme.sh /usr/local/bin/copy-theme
USER 1000:1000
ENTRYPOINT ["/usr/local/bin/copy-theme"]
CMD ["/target"]
