FROM node:22-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

COPY package.json package-lock.json* ./

# El build (react-router + vite) necesita las devDependencies; se quitan después.
RUN npm ci && npm cache clean --force

COPY . .

RUN npx prisma generate && npm run build && npm prune --omit=dev

ENV NODE_ENV=production

# docker-start = prisma migrate deploy + react-router-serve (escucha en $PORT, 3000 por defecto).
CMD ["npm", "run", "docker-start"]
