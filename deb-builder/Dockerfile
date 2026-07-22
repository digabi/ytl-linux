FROM --platform=linux/amd64 ubuntu:noble

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -y install ruby ruby-dev rubygems build-essential && \
    gem install --no-document fpm

RUN mkdir /deb
WORKDIR /deb
RUN mkdir deb-root

COPY deb-builder/ytl-fpm /usr/bin
COPY deb-builder/build-ytl-deb /usr/bin
