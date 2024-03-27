# Trip Itinerary Generator

There's an app for everything. There are hundreds of apps for generating travel itineraries. This is another one. But this one does not upsell, does not sell your data, and just creates 
a simple formatted PDF and/or HTML for easy distribution.

## Target Group

* Small business tour operators
* Family trip organizers

## Features

* Generates PDF (and very soon HTML) file
* Reads all data from a yaml file
* Works with activities/drives/sleep
* Lists itinerary in a well organized fashion
* Simple, understandable data format (yaml)
* Data can be easily backed up (yaml file)
* No vendor lock-in
* Code is easily adaptable and extendable

## Workflow

1. Clone this repository
1. Copy the `trips/example` directory to `trips/<your-trip-name>`
1. Modify the itinerary yml file to your needs
1. Set up this software (`npm install`)
1. Run the PDF generator (`node index.js -t <your-trip-name>`)
1. Find your generated PDF itinerary in the `pub` directory

## Options

With the `-l` switch, the language of the itinerary can be chosen: `-l de_DE`, for example. This requires the yaml itinerary file to contain language specific entries 
as well. In fact, the parser will check for every value in the yaml file, if a language specific key exists in the yaml file, and replace it in memory before 
generating the itinerary.

## Multilingual / Translations feature

There are two options to hold multilingual data:

1. Copy a monolingual itinerary, translate it, and publish it under a new name. Example: If the original itinerary is called "New Zealand Round Trip, 7 days", the copied and translated itinerary could be called "Neuseeland Rundreise, 7 Tage".
This is an easy way and keeps the data file nice and tidy. However, it may get messy when there are updates to the file such as added stops, changed sequences, or modified 
activities. Changes would need to be manually synchronized between the different language versions.

2. Integrating all languages into one data file with the optional translation yaml structure.

### Integrated Translation Yaml Structure
#### Usage


* **text**: The actual text used. This is a manual translation. Overrides a **suggestion**.
* **textOriginalHash**: Optional; hash of the default text at the time of creating the manual translation. Software implementations ideally update this hash whenever the **text** is updated. Useful to figure out which translations may need an update.
* **textTimestamp**: Optional; timestamp of the last update of the **text** field value. Useful to figure out which translations might be outdated.
* **suggestion**: Optional; software implementations may fill an automated translation into this field. Will be displayed if **text** field is missing.
* **suggestionOriginalHash**: Optional; hash of the default text at the time of creating the automated translation suggestion. Software implementations ideally update this hash whenever the **suggestion** is updated. Useful to figure out which translations may need an update.
* **suggestionTimestamp**: Optional; timestamp of the last update of the **suggestion** field value. Useful to figure out which translations might be outdated.

#### Examples
##### No Translation:
```
trip:
  title: South Island Round Trip, 5 days
```

##### Simple, manually translated version:
```
trip:
  title:
    translations:
      default: South Island Round Trip, 5 days
      en_EN: South Island Round Trip, 5 days
      de_DE: Südinsel Rundreise, 5 Tage
      fr_FR: Visite de l'île du Sud, 5 jours
```
The first language is the default value in case the translation for the requested language is not available.

##### Complex translation version:
```
trip:
  title:
    translations:
      - language: default
        text: South Island Round Trip, 5 days
      - language: de_DE
        text: Südinsel Rundreise, 5 Tage
        textOriginalHash: <hash>
        textTimestamp: <timestamp>
      - language: fr_FR
        text: Visite de l'île du Sud, 5 jours
        textOriginalHash: <hash>
        textTimestamp: <timestamp>
        suggestion: 
        suggestionOriginalHash:
        suggestionTimestamp: 
```
#### Parallel Usage

All options may be used in parallel in the same file. Parsers are supposed to validate and process any of these options in any given yaml file. 

Example: A tour operator decides to translate the description of a trip into several languages, but not the title.

```
trip:
  title: Aoraki / Mt Cook Day Trip
  description:
    translations:
      default: Enjoy the beautiful landscapes around Aoraki / Mt Cook! Departure from Queenstown.
      de_DE: Genießen Sie die wunderschöne Landschaft rund um Aoraki / Mt. Cook! Ab Queenstown.
      fr_FR: Profitez des magnifiques paysages autour d'Aoraki / Mt Cook! Départ de Queenstown.
```

## System Requirements

* Node.js `v21.4.0`
