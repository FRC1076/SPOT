const fs = require("fs");

const help = `
matchLevelExport.js [Event Number] [Input Filename] [Output Filename]
`

if (process.argv.length < 5) {
    console.error(help);
    process.exit(1);
}

let input;

const eventNumber = parseInt(process.argv[2], 10);
const inputFn = process.argv[3];
const outputFn = process.argv[4];
if (fs.existsSync(inputFn)) {
    input = JSON.parse(fs.readFileSync(inputFn));
}
else {
    console.error("Input file not found");
    process.exit(1);
}


//console.log(input);
const teamMatchesForEvent = input.filter(teamMatch => teamMatch.eventNumber === eventNumber);
const matchTeamSorter = function(a, b) {
    if (a.matchNumber === b.matchNumber) {
        return a.teamNumber > b.teamNumber ? 1 : -1;
    }
    else {
        return a.matchNumber > b.matchNumber ? 1 : -1;
    }
};




const calculatedColumns = [
    "aStop",
    "amplify",
    "broken",
    "coopertition",
    "goodDefense",
    "groundPickup",
    "harmony",
    "leave",
    "miss",
    "onstage",
    "onstageFall",
    "park",
    "scoreAmp",
    "scoreAmpedSpeaker",
    "scoreSpeaker",
    "sourcePickup",
    "spotlit",
    "trap",
    "unpark",
];

let headerRow = ["Match #",
                 "Team #",
                 ...calculatedColumns
                 ];

let rows = [];
rows.push(headerRow);

const actionCounter = function(m) {
    let result = [];
    for (let cn of calculatedColumns) {
        const actionCount = m.actionQueue.filter(a => a.id === cn).length;
        result.push(actionCount);
    }
    return result;
};

for (let sm of teamMatchesForEvent.sort(matchTeamSorter)) {
    let calculatedCounts = actionCounter(sm);
    rows.push([sm.matchNumber, sm.robotNumber, ...calculatedCounts]);
}

const csv = rows.map(row => row.reduce((acc,value) => acc+`,${value}`)).reduce((acc,row) => acc+`${row}\n`, "");
console.log(`Writing output to ${outputFn}...`);
fs.writeFileSync(outputFn, csv);
