FROM anchore/syft:latest AS syft
FROM python:3.12-slim
COPY --from=syft /syft /usr/local/bin/syft
ENTRYPOINT ["syft"]
