# syntax=docker/dockerfile:1

# Production image of the web app: the Angular build served by nginx, which also forwards /api
# to the API. Build it from the repository root, which holds the workspace lockfile:
#   docker build --file apps/web/Dockerfile --tag tasks-web .

# Pinned by version and digest: a rebuild gets the same base images, even if a tag is re-pushed.
ARG NODE_IMAGE=node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.30.6-alpine3.24@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

FROM ${NODE_IMAGE} AS build
ENV NG_CLI_ANALYTICS=false
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# No lifecycle scripts: every install script is denied in allowScripts anyway (the toolchain's
# prebuilt binaries ship as optional packages), and the root `prepare` script needs husky.
RUN --mount=type=cache,target=/root/.npm npm ci --workspace @tasks/web --ignore-scripts
COPY apps/web/ apps/web/
RUN npm run build --workspace @tasks/web

# nginx runs as an unprivileged user and listens on 8080.
FROM ${NGINX_IMAGE} AS runtime
USER root
RUN rm -rf /usr/share/nginx/html/*
USER 101
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY apps/web/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 8080
