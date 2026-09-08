FROM nginx:latest
EXPOSE 80 443

RUN apt-get update && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/certificado.key \
    -out /etc/nginx/ssl/certificado.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"
