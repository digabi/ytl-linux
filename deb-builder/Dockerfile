ARG DENO_VERSION

FROM --platform=linux/amd64 denoland/deno:bin-${DENO_VERSION?:required} AS deno

FROM --platform=linux/amd64 ubuntu:noble

ENV DEBIAN_FRONTEND=noninteractive

RUN mkdir /deb
WORKDIR /deb
RUN mkdir deb-root

RUN useradd -m builder && \
    chown -R builder:builder /deb

RUN apt-get update && \
    apt-get -y install ruby ruby-dev rubygems build-essential && \
    gem install --no-document fpm

COPY --from=deno /deno /usr/local/bin/deno

COPY deb-builder/ytl-fpm /usr/bin
COPY deb-builder/build-ytl-deb /usr/bin

USER builder
