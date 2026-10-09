# ============================================
# DATAFLOW360 - Frontend
# React + TypeScript + Vite
# ============================================

# ---------- Stage 1 : Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build


# ---------- Stage 2 : Production ----------
FROM nginx:alpine

# Supprimer la configuration nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier notre configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build React
COPY --from=builder /app/dist /usr/share/nginx/html

# Port HTTP
EXPOSE 80

# Lancer nginx
CMD ["nginx", "-g", "daemon off;"]