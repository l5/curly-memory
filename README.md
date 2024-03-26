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