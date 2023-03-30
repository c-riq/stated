# run npm run build in frontend folder first

FROM node:16-alpine 

WORKDIR /usr/src/stated

RUN apk update && apk add bind-tools

COPY backend/package*.json ./

RUN npm install 

COPY backend .

CMD [ "node", "server.js"  ]
