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

With the `-l` switch, the language of the itinerary can be chosen: `-l de_DE`, for example. This requires the yaml itinerary file to contain language-specific entries 
as well. In fact, the parser will check for every value in the yaml file, if a language-specific key exists in the yaml file, and replace it in memory before 
generating the itinerary.

## Format

The itinerary data file is yaml format, and consists of four main sections:

```yaml
metadata
trip
days
items
```

### Metadata section

```yaml
metadata:
  availableTranslations:
    - name: English
      code: default
    - name: Thai
      code: th_TH
```

The `metadata` / `availableTranslations` section lists languages a user can choose from for the itinerary to be displayed in.

### Trip section

```yaml
trip:
  title: My trip title
  subtitle: My trip subtitle
  description: |
    This is the description
  costNotes: |
    We recommend to plan $500 for extra expenses per day. All listed hotel cost include GST. In New Zealand, it is not required to give tips.
  accessories:
    - name: Walking shoes
    - name: Rainwear
  settings:
    currency: <USD | EUR | AUD | NZD | ...>
    unitDistance: km
    unitDriveTime: hours
    petrolPerLitre: 3
    litresPerKilometer: 12
    petrolFactor: 1.3
```

* **title**: Title of the trip (mandatory)
* **subtitle**: Subtitle of the trip (mandatory)
* **description**: Description of the trip (mandatory)
* **costNotes**: Notes about costing (optional)
* **accessories**: List of accessories that should be taken on the trip
  * **name**: Name of the accessory
* **settings**: General settings used for calculations and display
  * **currencySymbol**: Specifies which symbol is used for currencies as default
  * **unitDistance**: Specifies the unit used for distances
  * **unitDriveTime**: Specifies the unit used for driving times
  * **petrolPerLitre**: Specifies the estimated petrol price per litre
  * **litresPerKilometer**: Specifies how many litres are used per hundred kilometers
  * **petrolFactor**: Specifies a safety factor for kilometer/fuel calculations

## Multilingual / Translations feature

There are two options to hold multilingual data:

1. Copy a monolingual itinerary, translate it, and publish it under a new name. Example: If the original itinerary is called "New Zealand Round Trip, 7 days", the copied and translated itinerary could be called "Neuseeland Rundreise, 7 Tage".
This is an easy way and keeps the data file nice and tidy. However, it may get messy when there are updates to the file such as added stops, changed sequences, or modified 
activities. Changes would need to be manually synchronized between the different language versions.

2. Integrating all languages into one data file with the optional translation yaml structure.


### Cost Yaml Structure

```yaml
# Option 1: Number
cost: 20
# will be currency formatted 

# Option 2: String
cost: Cost $35 pp for tour + $25 for tasting
or
cost: $25pp
# will be printed as is

# Option 3: in case of a derivation from standard currency:
cost: 
  amount: 125
  currency: NZD


# Option 4:
# May be used if different prices apply
cost:
  info: |
    purchase ticket on site for full price; discounted, time-bound tickets may be 
    available via voucher platform
  prices: 
    - name: adult
      price: 15
    - name: child
      price: 5
      ageto: 14
    - name: child
      price: 0
      ageto: 2
      info: kids under 3 are free with accompanying adult.

# Zero cost
cost: 0
```


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
```yaml
trip:
  title: South Island Round Trip, 5 days
```

##### Simple, manually translated version:
```yaml
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
```yaml
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

```yaml
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
