const yaml = require('js-yaml')
const fs = require('fs')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const output_dir = 'pub/'
const weekday = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat'
}
const translations = {
    "itinerary": {
        en: "Itinerary",
        de: "Itinerary",
        th_TH: "รายละเอียดการเดินทาง"
    },
    "excerpt": {
        en: "excerpt",
        de: "Auszug"
    },
    "generated": {
        en: "Generated",
        de: "Generiert",
        th_TH: "สร้างขึ้น"
    },
    "totalpages": {
        en: "Total number of pages",
        de: "Seitenanzahl",
        th_TH: "จำนวนหน้าทั้งหมด"
    },
    "version": {
        en: "Version",
        de: "Version",
        th_TH: "รุ่น"
    },
    "download": {
        en: "Download latest version",
        de: "Herunterladen der aktuellsten Version unter"
    }
}


const filetypemap = {
    "png": "image/png",
    "jpg": "image/jpg",
    "svg": "image/svg+xml"
}

function readVersionNumber(trip) {
    const versionFileFullPath = `trips/${trip}/version`
    if (!fs.existsSync(versionFileFullPath)) {
        console.log(`File ${versionFileFullPath} does not exist. Exiting.`)
        return 1
    }
    return fs.readFileSync(versionFileFullPath, 'utf8').trim()
}

function readItineraryFromYaml(trip, lg) {
    // Get document, or throw exception on error
    try {
        var itinerary = {}
        const yamlFileFullPath = `trips/${trip}/itinerary.yml`
        if (!fs.existsSync(yamlFileFullPath)) {
            console.log(`File ${yamlFileFullPath} does not exist. Exiting.`)
            return 1
        }
        const doc = yaml.load(fs.readFileSync(yamlFileFullPath, 'utf8'))
        if (doc.hasOwnProperty("items")) {
            const items = changeYamlLanguage(doc['items'], lg)
            /*const sortedProjects = projects.sort(function (p1, p2) {
                let d1 = p1.yearfrom.toString()
                if (p1.monthfrom.toString().length < 2) { d1 += "0" + p1.monthfrom.toString() }
                else { d1 += p1.monthfrom.toString() }
                let d2 = p2.yearfrom.toString()
                if (p2.monthfrom.toString().length < 2) { d2 += "0" + p2.monthfrom.toString() }
                else { d2 += p2.monthfrom.toString() }
                if (d1 > d2) {
                    return -1
                } else {
                    return 1
                }
            })*/
            itinerary['items'] = items
        }
        if (doc.hasOwnProperty("days")) {
            itinerary['days'] = doc['days']
        }
        if (doc.hasOwnProperty("trip")) {
            itinerary['trip'] = changeYamlLanguage(doc['trip'], lg)
        }
        return itinerary
    } catch (e) {
        console.log(e)
    }
}

function changeYamlLanguage(yamlObject, destLg) {
    if (typeof yamlObject === 'object') {
        for (var key in yamlObject) {
            if (yamlObject[key] === null) continue
            if (typeof yamlObject[key] === 'object' && !("translations" in yamlObject[key])) {
                changeYamlLanguage(yamlObject[key], destLg)
            }
            else if (typeof yamlObject[key] === 'object' && "translations" in yamlObject[key]) {
                if (Array.isArray(yamlObject[key]["translations"])) { // Type 2
                    // search for the right language, or select default
                    var translations = yamlObject[key]["translations"]
                    var lang_id = null
                    var default_id = null
                    for (var i = 0; i < translations.length; i++) {
                        if ("language" in translations[i] && translations[i]['language'] == destLg) {
                            lang_id = i
                            break
                        }
                        if ("language" in translations[i] && translations[i]['language'] == "default") {
                            default_id = i
                        }
                    }
                    (lang_id === null) ? lang_id = default_id : null;
                    (default_id === null) ? lang_id = 0 : null;
                    if ("text" in translations[lang_id]) {
                        yamlObject[key] = translations[lang_id]["text"]
                    } else if ("suggestion" in translations[lang_id]) {
                        yamlObject[key] = translations[lang_id]["suggestion"]
                    }
                } else { // Type 1
                    if (yamlObject[key]["translations"] === null) continue
                    if (destLg in yamlObject[key]["translations"]) {
                        yamlObject[key] = yamlObject[key]["translations"][destLg]
                    } else {
                        yamlObject[key] = yamlObject[key]["translations"]["default"]
                    }
                }
            }
        }
    }
    return yamlObject
}

function selectTechLogo(tech) {
    var basePath = '../logos/'
    var logoFile = tech.toLowerCase()
    if (logoFile == 'c#') logoFile = 'csharp'
    var logoFileSvg = basePath + logoFile + ".svg"
    var logoFilePng = basePath + logoFile + ".png"
    if (fs.existsSync(logoFileSvg)) {
        return '<img src="../' + logoFileSvg + '" alt="' + tech + '" class="techlogo" />'
    }
    if (fs.existsSync(logoFilePng)) {
        return '<img src="../' + logoFilePng + '" alt="' + tech + '" class="techlogo" />'
    }
    return tech
}
function renderTechStack(techstack) {
    var ts = ''
    let i = 0
    while (i < techstack.length) {
        item = selectTechLogo(techstack[i])
        if (item.substring(0, 1) == '<') {
            if (ts.substring(ts.length - 1) != '>' && ts.length != 0) {
                ts += ' | ' + item
            } else {
                ts += item
            }
        } else {
            if (ts.length == 0) {
                ts += item
            } else if (ts.substring(ts.length - 1) == '>') {
                ts += '| ' + item
            } else {
                ts += ' | ' + item
            }
        }
        i++
    }
    return ts
}

function renderMenu(food) {
    var ts = ''
    let i = 0
    while (i < food.length) {
        item = food[i].name
        if (ts.length == 0) {
            ts += item
        } else {
            ts += ' | ' + item
        }
        i++
    }
    return ts
}

function str_pad(n) {
    return String("00" + n).slice(-2);
}
function renderCost(costingBlock, settings, priceFormat) {
    var myDescription = ''
    if (costingBlock && typeof costingBlock === 'object') {
        if ('info' in costingBlock) {
            myDescription += `${costingBlock.info}`
        }
        if ('prices' in costingBlock) { 
            myDescription += '<ul>'
            for (var i = 0; i < costingBlock.prices.length; i++) {
                myCost = renderCost(costingBlock.prices[i].cost)
                myDescription += `<li>${costingBlock.prices[i].name}: ${myCost}</li>`
            }
            myDescription += '</ul>'
        }
    } else if (costingBlock == 0) {
        myDescription += `free`
    } else if (isNaN(costingBlock)) {
        myDescription += `${costingBlock}`
    } else {
        myDescription += `${priceFormat.format(costingBlock)}`
    }
    return myDescription
}
function renderActivity(i, mytype, description, links, duration, settings, cost, priceFormat) {
    newItem = ''
    var title = i.name
    mytype = 'Activity'
    if (i.mandatory == false) {
        mytype += ' (optional)'
    }
    if (i.recommended == true) {
        mytype += ' <strong>*recommended*</strong>'
    }

    var myDescription = ''
    if ('description' in i) {
        myDescription = `<p>${i.description}</p>`
    }
    if ('cost' in i) {
        myDescription += `<p>Cost: ${renderCost(i.cost, settings, priceFormat)}</p>`
    }
    newItem =
        `<tr class="itinerary-type-${i.type}">
                <td class="timeframe">${mytype}</td><td class="iteminfo">
                <h6>${title}</h6>${myDescription}`
    if (links != "") {
        newItem += `<p>Links: ${links}</p>`
    }
    newItem += `</td>
                </tr>`
    return newItem
}

function renderDriveStop(i, settings, priceFormat) {
    newItem = ''
    var title = i.name
    var links = ""
    if ('links' in i) {
        for (linkid in i.links) {
            var thisLink = i.links[linkid]
            links += `<a href="${thisLink.url}">${thisLink.name}</a>`
            if (linkid < i.links.length - 1) { links += ' | ' }
        }
    }
    mytype = 'Activity'
    if (i.mandatory == false) {
        mytype += ' (optional)'
    }
    if (i.recommended == true) {
        mytype += ' <strong>*recommended*</strong>'
    }

    var myDescription = ''
    if ('description' in i) {
        myDescription = `<p>${i.description}</p>`
    }
    if ('cost' in i) {
        myDescription += `<p>Cost: ${renderCost(i.cost, settings, priceFormat)}</p>`
    }
    newItem =
        `<tr class="itinerary-type-${i.type}">
                <td class="driveline"><span class="drivewrapper"><span class="dot"></span><span class="line"></span></span></td>
                <td class="iteminfo">
                <h6>${title}</h6>${myDescription}`
    if (links != "") {
        newItem += `<p>Links: ${links}</p>`
    }
    newItem += `</td>
                </tr>`
    return newItem
}

function generateItinerary(lg = "en", trip) {
    var totalDistance = 0
    var totalTravelTime = 0
    var totalMandatoryCost = 0
    var totalAccommodationCost = 0

    if (trip == "" || trip === undefined) {
        console.log("Please specify trip name (should be a subdirectory of 'trips')")
        return 1
    }
    const tripDirectory = `trips/${trip}`
    if (!fs.existsSync(tripDirectory)) {
        console.log(`Directory ${tripDirectory} does not exist. Exiting.`)
        return 1
    }
    const versionNumber = readVersionNumber(trip)
    if (lg.length > 5 || lg.length < 2) {
        lg = 'en'
    }
    var now = new Date()

    const updateddate = `${now.getFullYear()}-${str_pad(now.getMonth() + 1)}-${str_pad(now.getDate())}`
    const $ = cheerio.load(fs.readFileSync('tpl/itinerary-for-pdf.html'))
    $(".updateddate").each(function () {
        $(this).html(updateddate)
    });
    $(".versionnumber").each(function () {
        $(this).html(versionNumber)
    });
    $(".translate").each(function () {
        $(this).html(translations[$(this).data('translate')][lg])
    })

    const itinerary = readItineraryFromYaml(trip, lg)
    if (itinerary === 1) {
        return 1
    }
    $('.triptitle').each(function () {
        $(this).html(itinerary.trip.title)
    })
    $('.tripsubtitle').each(function () {
        $(this).html(itinerary.trip.subtitle)
    })
    $('.tripdescription').each(function () {
        $(this).html(itinerary.trip.description.replaceAll("\n", "<br>"))
    })
    let settings = {}
    if (itinerary.trip.settings) {
        settings = itinerary.trip.settings
    }
    var priceFormat = Intl.NumberFormat(lg.replace('_', '-'))
    if (settings.currency) {
        priceFormat = Intl.NumberFormat(lg.replace('_', '-'), { // en-DE
            style: 'currency',
            currency: settings.currency // USD / NZD / EUR / ...
        })
    }
    $('#itinerarylist').html('')

    for (itemid in itinerary.items) {
        var i = itinerary.items[itemid]
        if ('display' in i && i['display'] === false) {
            continue;
        }
        var cost = 0
        if ('cost' in i && i.cost != 0) {
            cost = i.cost.adult
        }
        var duration = '?'
        if ('duration' in i && typeof (i.duration) == 'object' && 'recommended' in i.duration) {
            duration = i.duration.recommended
        } else if ('duration' in i && typeof (i.duration) == 'string') {
            duration = i.duration
        }
        var title = i.name
        var mytype = i.type
        var description = i.description
        var links = ''
        if ('links' in i) {
            for (linkid in i.links) {
                var thisLink = i.links[linkid]
                links += `<a href="${thisLink.url}">${thisLink.name}</a>`
                if (linkid < i.links.length - 1) { links += ' | ' }
            }
        }
        var newItem = ''
        if (i.type == 'drive') {
            title = i.from.name + " &rarr; " + i.to.name
            mytype = 'Drive'
            totalDistance += parseInt(i.distance)
            totalTravelTime += i.duration
            description = `Duration: ${i.duration} * Distance: ${i.distance} ${settings.unitDistance}`
            breakok = ""
            if ('stops' in i && i.stops.length > 0) {
                breakok = "breakInTr"
            }
            newItem =
                `<tr class="itinerary-type-${i.type} ${breakok}"><td class="timeframe">Drive</td>
                    <td class="iteminfo">
                        <h6>${title}</h6>
                        <p>${description}</p>`
            if ('stops' in i && i.stops.length > 0) {
                newItem += `<table class="driveStopsTable">
                    <tr><td class="driveline"><span class="drivewrapper"><span class="dot"></span><span class="line"></span></span></td><td colspan="2" class="iteminfo"><strong>${i.from.name}</strong></td></tr>`
                for (ii in i.stops) {
                    newItem += renderDriveStop(i.stops[ii], settings, priceFormat)
                }
                newItem += `
                    <tr><td class="driveline driveline-last"><span class="dot"></span></td><td colspan="2" class="iteminfo"><strong>${i.to.name}</strong></td></tr>
                </table>`
            }
            newItem += `</td><td></td>
                </tr>`
        }
        else if (i.type == 'activity') {
            newItem += renderActivity(i, mytype, description, links, duration, settings, cost, priceFormat)
        } else if (i.type == 'food') {
            mytype = 'Snack'
            if ('food' in i) {
                var foodMenu = renderMenu(i.food)
                description += '<br><br>Menu: ' + foodMenu
                // for (foodItem in i.food) {
                //     description += i.food[foodItem].name + ', '
                // }
            }
            newItem =
                `<tr class="itinerary-type-${i.type}"><td class="timeframe">${mytype}</td><td class="iteminfo">
                <h6>${title}</h6><p>${description}</p>
                </td>
                </tr>`
        } else if (i.type == 'sleep') {
            if (i.booking.cost.amount) {
                totalAccommodationCost += i.booking.cost.amount
            }
            mytype = "Night"
            var rooms = '</p><ul>'
            for (r in i.rooms) {
                var ro = i.rooms[r]
                rooms += `<li>${ro.rooms}x ${ro.type} with ${ro.beds} beds (${ro.description})</li>`
            }
            rooms += '</ul><p>'
            description = `${i.locationdescription}<br><br>Rooms: ${rooms}<br>Standard: ${i.standard} | Total cost: ${i.booking.cost.amount} ${i.booking.cost.currency} | Check-In: ${i.checkin.from} - ${i.checkin.to} | Check-Out: by ${i.checkout.by}<br>Address: ${i.address}<br>
                Links: ${links}`
            var datefrom = `${weekday[i.checkin.day.getDay()]} ${str_pad(i.checkin.day.getDate())}/${str_pad(i.checkin.day.getMonth())}`
            var dateuntil = `${weekday[i.checkout.day.getDay()]} ${str_pad(i.checkout.day.getDate())}/${str_pad(i.checkout.day.getMonth())}`
            newItem =
                `<tr class="itinerary-type-${i.type}"><td class="timeframe">${datefrom}<br>&rarr;<br>${dateuntil}</td><td class="iteminfo">
                <h6>${title}</h6><p>${description}</p>
                </td><td></td>
                </tr>`
        }
        // var links = renderLinks(i.links)
        else {
            newItem =
                `<tr class="itinerary-type-${i.type}"><td class="timeframe">${mytype}</td><td class="iteminfo">
                <h6>${title}</h6><p>${description}</p>
                </td><td></td>
                </tr>`

        }
        $('#itinerarylist').append(newItem)
    }
    let totalPetrolLiters = 0
    let petrolFactor = 1
    let totalPetrolCost = 0
    settings.petrolFactor != undefined ? petrolFactor = settings.petrolFactor : null;
    if (settings.litresPerKilometer && settings.petrolPerLitre) {
        totalPetrolLiters = settings.litresPerKilometer / 100 * totalDistance * petrolFactor
        totalPetrolCost = Math.round(totalPetrolLiters * settings.petrolPerLitre, 2)
    } else {
        console.log("If you specify `litresPerKilometer` and `petrolPerLitre` in the trip data, the system can calculate include the petrol cost estimation in the total cost estimation.")
    }
    totalMandatoryCost = Math.round(totalMandatoryCost, 2)
    totalAccommodationCost = Math.round(totalAccommodationCost, 2)
    let totalTripCost = Math.round(totalMandatoryCost + totalPetrolCost + totalAccommodationCost, 2)
    let totalTripCostStr = priceFormat.format(totalTripCost)
    $('#tripSummary').append(
        `<h2>Cost Estimation<h2><table class="costSummary"><tbody>
            <tr><th>Total Distance</td><td class="number">${totalDistance} ` + (settings.unitDistance != undefined ? ' ' + settings.unitDistance : '') + `</td></tr>` +
        (totalPetrolCost > 0 ? `<tr><th>Petrol cost</td><td class="number">
                ${priceFormat.format(settings.petrolPerLitre)} per litre<br/>
                ${settings.litresPerKilometer} litres per ${settings.unitDistance}<br/>
                Factor ${settings.petrolFactor} -> ${totalPetrolLiters} l<br/>
                <strong>Total petrol estimation: ${priceFormat.format(totalPetrolCost)}</strong></td></tr>` : ``) + `
            <tr><th>Accommodation Cost estimation</td><td class="number">${priceFormat.format(totalAccommodationCost)}</td></tr>
            <tr><th>Total Trip Cost estimation</td><td class="number">${priceFormat.format(totalTripCost)}</td></tr>
        </tbody></table>`
    )
    if ('costNotes' in itinerary.trip) {
        $('#tripSummary').append(`<p class="costNotes">${itinerary.trip.costNotes.replaceAll("\n", '<br>')}</p>`)
    }
    var accessoriesList = ""
    for (item in itinerary.trip.accessories) {
        accessoriesList += `<li>${itinerary.trip.accessories[item].name}</li>`
    }
    if (accessoriesList != "") {
        $('#tripSummary').append(
            `<h2>Don't forget:</h2>
            <ul>${accessoriesList}</ul>`
        )
    }

    // $("img").each(function () {
    //     var original_src = $(this).attr("src")
    //     var file_extension = original_src.split('.').slice(-1)[0] // extract file extension
    //     if (!filetypemap[file_extension]) {
    //         console.log("There is no mapping for file extension '" + file_extension + "'.")
    //         return
    //     }
    //     var local_filename = original_src.substring(3) // remove "../" from the beginning of the path
    //     if (!fs.existsSync(local_filename)) {
    //         console.log("File does not exist: " + local_filename)
    //         return
    //     }
    //     var local_src = "data:" + filetypemap[file_extension] + ";base64," + fs.readFileSync(local_filename).toString('base64')
    //     $(this).attr("src", local_src)
    // });
    ;
    (async () => {
        const browser = await puppeteer.launch({ headless: 'new' })
        const page = await browser.newPage()
        const filename = `itinerary-${trip}-${versionNumber}-${lg}.pdf`
        await page.emulateMediaType('print')
        await page.setContent($.html())
        if (!fs.existsSync(output_dir)) {
            fs.mkdirSync(output_dir, { recursive: true });
        }
        await page.pdf({
            path: output_dir + filename, format: 'A4',
            displayHeaderFooter: true,
            printBackground: true,
            headerTemplate: `<span style="font-size: 9px; width: 87%; margin: auto; height: 20px; color: #ccc; font-family: Arial, sans-serif;">${itinerary.trip.title} / ${itinerary.trip.subtitle} | ${translations.itinerary[lg]}</span>`,
            footerTemplate: `<table style="font-size: 9px; width: 88%; margin: auto; height: 10px;"><tr><td style="text-align: left; font-family: Arial, sans-serif;">${translations.itinerary[lg]} ${translations.version[lg]} ${versionNumber}; ${translations.generated[lg]} ${updateddate}. ${translations.totalpages[lg]}: <span class="totalPages"></span></td><td color: #000; text-align: right; margin: 20px;"><span class="pageNumber" style="font-family: Arial, sans-serif;"></span></td></tr></table>`,
            margin: { top: "100px", bottom: "50px" }
        })
        await browser.close()
        console.log('PDF generated as ' + output_dir + filename + '.')
        // var links = {}
        // links[lg] = 'doc/projectlist/' + filename
        // updateLinksInHtml(links)
    })()
}

module.exports = generateItinerary