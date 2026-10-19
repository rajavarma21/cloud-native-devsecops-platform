
FROM node:22-alpine AS build

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@12.2.0 \
    && npm ci --omit=dev \
    && npm cache clean --force

COPY src ./src


FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/src ./src

# Remove package-management tooling from the runtime image.
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
