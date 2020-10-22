FROM pelias/baseimage

COPY . /code/metadata

WORKDIR /code/metadata

RUN npm install
