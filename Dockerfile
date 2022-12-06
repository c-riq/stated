FROM node:16

WORKDIR /usr/src/stated

RUN apt-get update && apt-get install -y dnsutils

COPY backend/package*.json ./

# ENV NODE_ENV=production
# ENV DOMAIN=example.com
ENV POSTGRES_HOST=db

RUN npm install

COPY backend .

EXPOSE 7766
CMD [ "node", "server.js" ]
