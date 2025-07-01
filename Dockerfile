FROM node:lts-alpine3.21

# Install security updates and remove cache
RUN apk update && \
    apk upgrade && \
    apk add --no-cache npm dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S app && \
    adduser -u 1001 -S -G app -h /app app

# Set working directory
WORKDIR /app

COPY --chown=app:app . .

USER app

RUN npm install && \
    npm audit --fix --force 

RUN chmod +x ./deploy.sh && \
    sh ./deploy.sh

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "run", "start:dev"]

EXPOSE 3001
