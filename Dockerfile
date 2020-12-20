ARG NODE_ENV

FROM node:lts-alpine as build

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM node:lts-alpine as prod

RUN apk add --no-cache runc wget

WORKDIR /build
RUN wget -c https://github.com/moby/buildkit/releases/download/v0.8.0/buildkit-v0.8.0.linux-amd64.tar.gz -O - | tar -xz
ENV PATH=${PATH}:/build/bin


FROM node:lts-alpine as dev

ENV DOCKER_HOST=tcp://host.docker.internal:2375
RUN apk add --no-cache docker-cli


FROM ${NODE_ENV}

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY --from=build dist/ .
COPY --from=build docker/ ./docker

CMD [ "npm", "start" ]
