FROM node:lts-alpine as build

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine

RUN apk add --no-cache runc wget curl

WORKDIR /build
RUN wget -c https://github.com/moby/buildkit/releases/download/v0.8.0/buildkit-v0.8.0.linux-amd64.tar.gz -O - | tar -xz
ENV PATH=${PATH}:/build/bin

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin/kubectl
RUN kubectl config set-context default

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=build dist/ .
COPY --from=build docker/ ./docker

CMD [ "npm", "start" ]
