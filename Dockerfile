# використовуємо образ лінукс алпайнс з нодою v14
FROM node:19.5.0-alpine

# вказуєм робочу директорію
WORKDIR /app

# Копіюємо package.json 
COPY package*.json ./

# Ставимо залежності
RUN npm install

#Копіюєм апп в контейнер
COPY . .

# Установлюєм Prisma
RUN npm install -g prisma

# Гегеруєм Prisma client
RUN prisma generate

# Copy Prisma schema
COPY prisma/schema.prisma ./prisma/

# Відкрити порт в нашому контейнері
EXPOSE 3000

# Запуск сервера
CMD ["npm", "start"]