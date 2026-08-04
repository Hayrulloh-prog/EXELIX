FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build || true
EXPOSE 3002
CMD ["node", "dist/index.js"]
