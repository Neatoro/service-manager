FROM node:lts-alpine

RUN apk add --no-cache unzip

WORKDIR /app
COPY app.zip .
RUN unzip app.zip && rm app.zip
