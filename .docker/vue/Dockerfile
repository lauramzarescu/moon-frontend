# Stage 1 - base
FROM node:22-alpine AS base

WORKDIR /code

# Stage 2 - builder
FROM base AS builder

COPY package*.json ./
RUN npm install

COPY ./ ./
RUN npm run build

# Stage 3 - run
FROM base AS final

RUN apk add --no-cache \
    git \
    wget curl \
    nginx \
    supervisor

WORKDIR /code

COPY package.json ./
COPY .docker/vue/nginx-app.conf ./

# Copy the built application files
COPY --from=builder /code/dist /code/dist
COPY --from=builder /code/node_modules /code/node_modules

# Configure nginx
RUN mv ./nginx-app.conf /etc/nginx/nginx.conf

# Copy startup script
COPY .docker/vue/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

ENTRYPOINT ["/start.sh"]

