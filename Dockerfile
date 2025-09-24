FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm to align with the project toolchain
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy lockfile and manifest first to leverage docker layer caching
COPY pnpm-lock.yaml package.json ./

# Install dependencies without running lifecycle scripts
RUN pnpm install --frozen-lockfile

# Copy the remaining project files and build the production bundle
COPY . .
RUN pnpm build

FROM nginx:alpine

WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
