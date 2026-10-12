FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8001
ARG VITE_UTILISER_API=false
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_UTILISER_API=${VITE_UTILISER_API}

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
