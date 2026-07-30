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

# Not changing user here because we need to use root to copy to and from the volume, otherwise we need to change perms which will be written back to the host
# ...and Docker cp cannot use wildcards so copying the built deb out of the container would be annoying if we were to use a read-only volume
