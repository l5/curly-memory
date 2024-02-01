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
        de: "Itinerary"
    },
    "excerpt": {
        en: "excerpt",
        de: "Auszug"
    },
    "generated": {
        en: "Generated",
        de: "Generiert"
    },
    "totalpages": {
        en: "Total number of pages",
        de: "Seitenanzahl"
    },
    "version": {
        en: "Version",
        de: "Version"
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

function readItineraryFromYaml(trip) {
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
            const items = doc['items']
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
            itinerary['trip'] = doc['trip']
        }
        return itinerary
    } catch (e) {
        console.log(e)
    }
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

function generateItinerary(lg = "en", trip) {
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
    if (lg !== 'de') {
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

    const itinerary = readItineraryFromYaml(trip)
    if (itinerary === 1) {
        return 1
    }
    $('.triptitle').each(function() {
        $(this).html(itinerary.trip.title)
    })
    $('.tripsubtitle').each(function() {
        $(this).html(itinerary.trip.subtitle)
    })
    $('.tripdescription').each(function() {
        $(this).html(itinerary.trip.description)
    })
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
        if ('duration' in i && typeof(i.duration) == 'object' && 'recommended' in i.duration) {
            duration = i.duration.recommended
        } else if ('duration' in i && typeof(i.duration) == 'string') {
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
                if (linkid < i.links.length - 1) { links += ' | '}
            }
        }
        var newItem = ''
        if (i.type == 'drive') {
            title = i.from.name + " &rarr; " + i.to.name
            mytype = 'Drive'
            description = `Duration: ${i.duration} * Distance: ${i.distance}`
            newItem =
                `<tr class="itinerary-type-${i.type}"><td class="timeframe">Drive</td>
                    <td class="iteminfo">
                        <h6>${title}</h6>
                        <p>${description}</p>
                    </td><td></td>
                </tr>`
        }
        else if (i.type == 'activity') {
            mytype = 'Activity'
            if (i.mandatory == false) {
                mytype += ' (optional)'
            }
            var myDescription = ''
            if ('description' in i) {
                myDescription = `<p>${i.description}</p>`
            }
            if ('cost' in i) {
                if (typeof(i.cost) == 'object') {
                    myDescription = `<p>Cost: $${i.cost.adult} pp (${i.cost.info})</p>`
                } else if (i.cost == 0) {
                    myDescription = `<p>Cost: free</p>`
                } else {
                    myDescription = `<p>Cost: $${i.cost} pp</p>`
                }
            }
            newItem =
                `<tr class="itinerary-type-${i.type}"><td class="timeframe">${mytype}</td><td class="iteminfo">
                <h6>${title}</h6>${myDescription}
                </td>
                </tr>`
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