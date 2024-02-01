#! /usr/bin/env node
const { program } = require("commander");
const generateItinerary = require('./commands/generateItinerary')
const lg = "en" // default language
program.version("0.0.1").description("Itinerary PDF from yaml generator");

program
    .option('-t, --trip [trip]', 'Trip')
    .description('Generates PDF file from trips/<trip>/itinerary.yaml')

program.parse(process.argv);
var trip = program.opts().trip
generateItinerary(lg, trip)