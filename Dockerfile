FROM node:lts

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY . ./
RUN chown -R node:node /app
USER node
RUN npm ci

EXPOSE 8080
CMD npm start
