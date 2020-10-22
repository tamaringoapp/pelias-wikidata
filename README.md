# What is this ?

Download and extract metadata information from a wikidata json dump file. 
This project is mostly meant to be used with a [Pelias](https://github.com/pelias/pelias) stack, in order to complete data coming from other sources (see below).
However, all it does is extract data from the dump, so you might fin dother purposes to it.

# With Pelias

Openstreetmap comes with a lot of useful information about places. However, sometimes you need more. This is an importer that will bring data coming from Wikidata and prepare it in order to import it into Pelias along with other importers (such as [Openstreetmap](https://github.com/pelias/openstreetmap) or [whosonfirst](https://github.com/pelias/whosonfirst)).

Warning:
It is meant to **complete** other sources and is not a place source on its own. In other words, extracted data will often go into the addendum field.

# Extracted Items

Only items that meet at least one of the following conditions are extracted:
- has [coordinates location](https://www.wikidata.org/wiki/Property:P625)
- has an [OpenStreetMap relation id](https://www.wikidata.org/wiki/Property:P402)
- has a [Who's on first id](https://www.wikidata.org/wiki/Property:P6766)

# Extracted fields

Currently, this project extracts 2 fields:

- Translated names (labels)

Osm is usually not very complete or well updated when it comes to place names. Translated names of known places will be extracted from wikidata and will complete those imported from osm.

- Images

It is often nice to be able to show an image of places to the user when they use the [autocomplete](https://github.com/pelias/documentation/blob/master/autocomplete.md). Images can be extracted from wikidata (when available). (Only the first image is extracted).

Important note about:
Images from wikidata are usually under a [Creative Commons](http://creativecommons.org/) license. However, most of them require attribution. This importer **does not extract information about attributions** (license type or author). You are responsible for extracting them by other means (for example, using the [wikimedia api](https://commons.wikimedia.org/w/api.php)) and showing it to your users accordingly.

# Usage

## Configure

```json
{
  // under imports
  "imports": {
    "wikidata": {
      "datapath": "/path/to/wikidata",
      "download": {
        // URL of the source file (downlaod phase)
        // It has to be a gz compressed json
        "sourceURL": "http://dumps.wikimedia.your.org/wikidatawiki/entities/latest-all.json.gz"
      },
      "import": {
        // name of the file to use in the extract phase
        "filename": "latest-all.json.gz"
      },
      // languages to keep in the etract phase (for labels)
      "langs": ["fr", "en", "es"]
    }
  }
}
```

## Extract metadata

The easiest and recommended way of using the importer is through Docker. The image `tamaringo/pelias-wikidata` can be found on [dockerhub](https://hub.docker.com/repository/docker/tamaringo/pelias-wikidata)


```sh
# download wikidata json dump
docker run --rm -it tamaringo/pelias-wikidata bin/download
# extract the fields into the sqlite3 database
docker run --rm -it tamaringo/pelias-wikidata bin/extract
```

## import into pelias

After generating a sqlite3 file containing the information, you'll need to extend pelias in order to use it with your osm importer.

_To be documented_
