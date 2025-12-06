#DOCKER_BUILDKIT=1 docker build --file Dockerfile --output docker_output .

FROM node:22-alpine AS stage1
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npx react-scripts build

FROM scratch AS export-stage
COPY --from=stage1 /app/build/* .
