FROM php:8.3.17-fpm

ARG URL_REPOSITORIO
ARG CORREO
ARG NOMBRE
ARG RAMA


# instalacion de paquetes
RUN apt-get update && apt-get install -y git vim npm

# instalacion de node
RUN curl -fsSL https://deb.nodesource.com/setup_current.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs
RUN rm -rf nodesource_setup.sh

# instalacion extenciones php
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN install-php-extensions curl fileinfo mbstring pdo_mysql pdo_pgsql gd zip

# Instalacion composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV COMPOSER_DISABLE_PLUGIN=true

# configuracion git
RUN git config --global safe.directory '*' && \
    git config --global pull.rebase true && \
    git config --global rebase.autoStash true && \
    git config --global user.name ${NOMBRE} && \
    git config --global user.email ${CORREO}



# Descarga de repositorio
WORKDIR /var/www
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) && \
    repo_path=$(echo "${URL_REPOSITORIO}" | sed -E "s|^https?://||; s|\\.git$||") && \
    git clone --branch ${RAMA} "https://x-access-token:${GITHUB_TOKEN}@${repo_path}.git" app && \
    cd app && git remote set-url origin "https://${repo_path}.git"
WORKDIR /var/www/app


# instalacion modulos
RUN rm -rf vendor node_modules
RUN composer install && npm install
RUN npm run build

# Configurar permisos para Laravel (no funcionando)
RUN chown -R www-data:www-data /var/www/app && \
    chmod -R 775 /var/www/app/storage && \
    chmod -R 775 /var/www/app/bootstrap/cache
