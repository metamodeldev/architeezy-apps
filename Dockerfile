FROM nginx:1.29.6-alpine3.23 AS app
COPY nginx.conf /etc/nginx/templates/default.conf.template
RUN rm -Rf /usr/share/nginx/html/*
COPY src /usr/share/nginx/html/
HEALTHCHECK CMD curl --fail --silent http://localhost/health | grep UP || exit 1
