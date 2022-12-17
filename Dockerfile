FROM node:19
WORKDIR /usr/src/app
COPY . .
COPY ./docker-sql-init.sql /docker-entrypoint-initdb.d/init.sql
RUN npm install -g typescript
RUN npm install
RUN tsc
RUN cp -r /usr/src/app/build/. .
RUN rm *.ts
CMD [ "npm", "start" ]
