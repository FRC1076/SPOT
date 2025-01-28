const { Router } = require("express");
const { TeamMatchPerformance } = require("../../lib/db.js");
const axios = require("axios");
const config = require("../../../config/config.json");

let router = Router();

router.get("/dataset", async (req, res) => {
  res.json(
    await TeamMatchPerformance.find({ eventNumber: config.EVENT_NUMBER })
  );
});

if (!config.secrets.TBA_API_KEY) {
  console.error(
    chalk.whiteBright.bgRed.bold(
      "TBA_API_KEY not found in config.json file! SPOT will not properly function without this."
    )
  );
}

router.get("/teams", async (req, res) => {
  if (!config.secrets.TBA_API_KEY) {
    return res.json([]); //no key, no teams
  }
  let teams = [];

  teams = (await axios.get("/schedule/api/tempTeams")).data;

  if (teams.length === 0) {
    teams = (
      await axios
        .get(
          `https://www.thebluealliance.com/api/v3/event/${config.TBA_EVENT_KEY}/teams`,
          {
            headers: {
              "X-TBA-Auth-Key": config.secrets.TBA_API_KEY,
            },
          }
        )
        .catch((e) =>
          console.error(
            e,
            chalk.bold.red("\nError fetching teams from Blue Alliance API!")
          )
        )
    ).data;
  }
  res.json(teams);
});

router.get("/manual", async (req, res) => {
  const manual = {
    teams: require("../manual/teams.json"),
    tmps: require("../manual/tmps.json"),
  };

  res.json(manual);
});

router.get("/csv", async (req, res) => {
  let dataset = await execute();

  //create rows
  let rows = [];
  let headerRow = true;
  let checkData = function (team) {
    if (
      Object.entries(team).filter(([key, value]) => key != "manual").length == 0
    ) {
      return false;
    }
    return true;
  };

  for (let [teamNumber, team] of Object.entries(dataset.teams).filter(
    ([num, team]) => checkData(team)
  )) {
    if (headerRow) {
      headerRow = false;
      rows.push([
        "Team #",
        ...Object.entries(team.averages)
          .filter(([key, value]) => !isNaN(value) && value)
          .map(([i, x]) => i + " Average"), //all averages
        ...Object.entries(team.averageScores)
          .filter((item) => !isNaN(item))
          .map(([i, x]) => i + " Score Average"), //all averages
        "Average Cycle",
        "Average Completed Cycle",
      ]);
    }
    rows.push([
      teamNumber,
      ...Object.entries(team.averages)
        .filter(([key, value]) => !isNaN(value) && value)
        .map(([i, x]) => x), //all averages
      ...Object.entries(team.averageScores)
        .filter((item) => !isNaN(item))
        .map(([i, x]) => x), //all averages
      team.cycle.averageTime,
      team.cycle.averageTimeComplete,
    ]);
  }

  //make into csv
  let csv = rows
    .map((row) => row.reduce((acc, value) => acc + `,${value}`))
    .reduce((acc, row) => acc + `${row}\n`, "");
  res.set({ "Content-Disposition": `attachment; filename="teams.csv"` });
  res.send(csv);
});

router.get("/csv-export", async (req, res) => {
  let rows = [];

  // header row
  rows.push([
    "Scouter",
    "Match",
    "Team",
    "Broken (or A-Stopped)",
    "Preload Coral",
    "Preload Algae",
    "Preload None",
    "Auto Ground Pickup Coral",
    "Auto Station Pickup Coral",
    "Auto Drop Coral",
    "Auto Score Coral (Total Attempts)",
    "Auto Score L1",
    "Auto Score L2",
    "Auto Score L3",
    "Auto Score L4",
    "Auto Miss Coral",
    "Auto Ground Pickup Algae",
    "Auto Reef Pickup Algae",
    "Auto Drop Algae",
    "Auto Score Algae (Total Attempts)",
    "Auto Score Processor Algae",
    "Auto Miss Processor Algae",
    "Auto Score Net Algae",
    "Auto Miss Net Algae",
    "Auto Leave",
    "Teleop Ground Pickup Coral",
    "Teleop Station Pickup Coral",
    "Teleop Drop Coral",
    "Teleop Score Coral (Total Attempts)",
    "Teleop Score L1",
    "Teleop Score L2",
    "Teleop Score L3",
    "Teleop Score L4",
    "Teleop Miss Coral",
    "Teleop Ground Pickup Algae",
    "Teleop Reef Pickup Algae",
    "Teleop Drop Algae",
    "Teleop Score Algae (Total Attempts)",
    "Teleop Score Processor Algae",
    "Teleop Miss Processor Algae",
    "Teleop Score Net Algae",
    "Teleop Miss Net Algae",
    "Good Defense",
    "Park",
    "Shallow",
    "Deep",
    "Fall"
  ]);

  // import json data
  var obj = await TeamMatchPerformance.find({ eventNumber: config.EVENT_NUMBER });
  console.log(obj);

  function countOccurences(array, value){
    var count = 0;
    for(key in array) {
      if (array[key]["id"] == value) {
        count++;
      }
    }
    return count;
  }

  for(x in obj) {
    rows.push([
      obj[x]["scouterId"], //scouter name
      obj[x]["matchNumber"], // match number
      obj[x]["robotNumber"], // team number
      countOccurences(obj[x]["actionQueue"], "broken"), // Broken (or A-Stopped)
      countOccurences(obj[x]["actionQueue"], "preloadCoral"), // Preload Coral
      countOccurences(obj[x]["actionQueue"], "preloadAlgae"), // Preload Algae
      countOccurences(obj[x]["actionQueue"], "preloadNone"), // Preload None
      countOccurences(obj[x]["actionQueue"], ""), // Auto Ground Pickup Coral
      countOccurences(obj[x]["actionQueue"], ""), // Auto Station Pickup Coral
      countOccurences(obj[x]["actionQueue"], ""), // Auto Drop Coral
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score Coral (Total Attempts)
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score L1
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score L2
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score L3
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score L4
      countOccurences(obj[x]["actionQueue"], ""), // Auto Miss Coral
      countOccurences(obj[x]["actionQueue"], ""), // Auto Ground Pickup Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Reef Pickup Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Drop Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score Algae (Total Attempts)
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score Processor Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Miss Processor Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Score Net Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Miss Net Algae
      countOccurences(obj[x]["actionQueue"], ""), // Auto Leave
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Ground Pickup Coral
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Station Pickup Coral
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Drop Coral
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score Coral (Total Attempts)
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score L1
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score L2
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score L3
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score L4
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Miss Coral
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Ground Pickup Algae
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Reef Pickup Algae
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Drop Algae
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score Algae (Total Attempts)
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score Processor Algae
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Miss Processor Algae
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Score Net Algae
      countOccurences(obj[x]["actionQueue"], ""), // Teleop Miss Net Algae
      countOccurences(obj[x]["actionQueue"], ""), // Good Defense
      countOccurences(obj[x]["actionQueue"], ""), // Park
      countOccurences(obj[x]["actionQueue"], ""), // Shallow
      countOccurences(obj[x]["actionQueue"], ""), // Deep 
      countOccurences(obj[x]["actionQueue"], ""), // Fall
    ])
  }

  //make into csv
  let csv = rows
    .map((row) => row.reduce((acc, value) => acc + `,${value}`))
    .reduce((acc, row) => acc + `${row}\n`, "");
  res.set({ "Content-Disposition": `attachment; filename="data.csv"` });
  res.send(csv);
});

module.exports = router;