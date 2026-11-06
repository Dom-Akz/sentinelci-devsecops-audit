FROM hadolint/hadolint:latest AS hadolint
FROM python:3.12-slim
COPY --from=hadolint /bin/hadolint /usr/local/bin/hadolint
ENTRYPOINT ["hadolint"]
