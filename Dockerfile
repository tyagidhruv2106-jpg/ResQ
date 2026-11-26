FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY shared ./shared
COPY services ./services
COPY scripts ./scripts
COPY database ./database

ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]
