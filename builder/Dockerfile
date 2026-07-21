FROM --platform=linux/amd64 ubuntu:noble

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -y install wget fdisk libarchive-tools xorriso cd-boot-images-amd64

RUN mkdir /app

COPY builder/build-ytl-image /app/
COPY templates/ /app/templates/
