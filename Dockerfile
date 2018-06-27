from node:9.11

WORKDIR /app
ADD . .
RUN npm i
EXPOSE 3228
EXPOSE 8080
CMD ["node", "index.js"]
