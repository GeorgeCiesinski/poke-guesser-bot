FROM node:19.6-bullseye-slim
WORKDIR /usr/src/app
COPY . .
RUN npm install -g typescript
RUN npm install
RUN tsc
RUN cp -r /usr/src/app/build/. .
RUN rm *.ts
CMD [ "npm", "start" ]
