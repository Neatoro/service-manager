FROM node:lts-alpine as build

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine

RUN apk add --no-cache runc wget

WORKDIR /build
RUN wget -c https://github.com/moby/buildkit/releases/download/v0.8.0/buildkit-v0.8.0.linux-amd64.tar.gz -O - | tar -xz
ENV PATH=${PATH}:/build/bin

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=build dist/ .

CMD [ "npm", "start" ]
