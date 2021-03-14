FROM node:lts

WORKDIR /client
COPY package.json ./
COPY package-lock.json ./
COPY . ./
RUN chown -R node:node /client
USER node
RUN npm ci

EXPOSE 3000
CMD npm start
