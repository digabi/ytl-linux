FROM --platform=linux/amd64 ubuntu:noble

ENV DEBIAN_FRONTEND=noninteractive

RUN mkdir /iso
RUN useradd -m builder && \
    chown -R builder:builder /iso

RUN apt-get update && \
    apt-get -y install wget fdisk libarchive-tools xorriso cd-boot-images-amd64

COPY builder/build-ytl-image /usr/bin
COPY templates/ /iso/templates/

USER builder
