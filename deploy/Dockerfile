FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY . .
ENV ENVPATH=/envpath/.env
CMD npm run start