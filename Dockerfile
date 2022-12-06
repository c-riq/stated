FROM node:16-alpine

WORKDIR /usr/src/stated

RUN apk update && apk add bind-tools

COPY backend/package*.json ./

# ENV NODE_ENV=production
# ENV DOMAIN=example.com
ENV POSTGRES_HOST=db

RUN npm install

COPY backend .

EXPOSE 7766
CMD [ "node", "server.js" ]
