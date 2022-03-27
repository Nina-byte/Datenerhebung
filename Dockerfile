#!/bin/bash
FROM arm64v8/node:current-alpine
#docker buildx build --platform linux/arm64/v8  -t elinkprath/scraperarm .  --push
ENV NODE_ENV=production
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    npm \
    git

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    AWS_SDK_LOAD_CONFIG=1

# Puppeteer v10.0.0 works with Chromium 92.
RUN yarn add puppeteer@10.0.0

RUN npm install -g forever
# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app


WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production && mv node_modules ../
COPY . .
COPY .aws /home/pptruser/.aws
EXPOSE 3000
RUN chown -R node /usr/src/app
USER pptruser
#start with forever
CMD forever src/app.js