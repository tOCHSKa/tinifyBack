FROM node:20-alpine

WORKDIR /app

# Copier package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

ENV NODE_ENV=production

RUN npm install --production

# Copier tout le reste du code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
