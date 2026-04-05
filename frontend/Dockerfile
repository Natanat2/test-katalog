FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json /app/
RUN npm ci

COPY . /app

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5173

COPY package*.json /app/
RUN npm ci --omit=dev

COPY --from=build /app/dist /app/dist
COPY --from=build /app/server.js /app/server.js

EXPOSE 5173

HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -q -O /dev/null http://127.0.0.1:5173/ || exit 1

CMD ["node", "server.js"]
