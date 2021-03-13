FROM node:lts

WORKDIR /api
COPY package.json ./
COPY package-lock.json ./
COPY . .
RUN chown -R node:node /api
USER node
RUN npm ci

EXPOSE 8080
CMD npm run dev
