# Используем официальный образ Node.js
FROM node:20-slim

# Устанавливаем рабочую директорию в контейнере
WORKDIR /backend

ARG DATABASE_URL
ARG BACKEND_PORT

ENV DATABASE_URL=$DATABASE_URL
ENV BACKEND_PORT=$BACKEND_PORT

# Устанавливаем временную зону
ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Копируем только package.json и package-lock.json сначала, чтобы использовать кэш Docker
COPY package.json ./
COPY package-lock.json ./
RUN apt-get update -y && apt-get install -y openssl && ca-certificates
RUN npm install


# Устанавливаем Prisma и генерируем клиента
RUN npm install -g prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Копируем остальные файлы
COPY . .

# Выполняем миграцию Prisma
RUN npx prisma migrate deploy

# Собираем TypeScript код
RUN npm run build

# Пересобираем bcrypt, если нужно
RUN npm rebuild bcrypt --build-from-source

EXPOSE $BACKEND_PORT

# Запускаем приложение
CMD ["npm", "start"]
