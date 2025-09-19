FROM nginx:alpine

RUN mkdir -p /var/www
WORKDIR /var/www
COPY ./dist /var/www

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]