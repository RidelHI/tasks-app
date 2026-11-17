# syntax=docker/dockerfile:1

# Production image of the API. Build it from the repository root, which holds the workspace
# lockfile:
#   docker build --file apps/api/Dockerfile --tag tasks-api .
# The same image runs the migrations (see the `migrate` service in compose.yaml).

# Pinned by version and digest: a rebuild gets the same base image, even if the tag is re-pushed.
ARG NODE_IMAGE=node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

FROM ${NODE_IMAGE} AS manifests
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# No lifecycle scripts in any install: every install script is denied in allowScripts anyway,
# and the root `prepare` script needs husky, a development tool.
FROM manifests AS build
RUN --mount=type=cache,target=/root/.npm npm ci --workspace @tasks/api --ignore-scripts
COPY apps/api/ apps/api/
RUN npm run build --workspace @tasks/api

# --omit=optional: optional dependencies stay out. The API uses none at runtime: they are
# typescript (for the Swagger plugin, at build time), gRPC (for a terminus check the API does
# not use) and pg-cloudflare (for Cloudflare Workers), about 30 MB.
FROM manifests AS production-dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @tasks/api --omit=dev --omit=optional --ignore-scripts

FROM ${NODE_IMAGE} AS runtime
# The app needs node only: without npm, corepack and yarn the image has fewer packages to patch.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/bin/corepack /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies /app ./
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3000
# node runs the app directly (no npm in between), so it receives SIGTERM and closes cleanly.
CMD ["node", "dist/main.js"]
