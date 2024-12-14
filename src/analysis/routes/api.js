const { Router } = require("express");
const { TeamMatchPerformance } = require("../../lib/db.js");
const axios = require("axios");
const executePipeline = require("../public/js/analysisPipeline.js");
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
  let dataset = await executePipeline();

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
    "Scouter Name",
    "Robot Number",
    "Match Number",
    "auton-broken",
    "auton-leave",
    "auton-penalty",
    "auton-scoreBall",
    "auton-scoreCrate",
    "teleop-broken",
    "teleop-intakeBall",
    "teleop-launchBall",
    "teleop-penalty",
    "teleop-scoreCrateBottom",
    "teleop-scoreCrate2nd",
    "teleop-scoreCrate3rd",
    "teleop-scoreCrateTop",
  ]);

  // import json data
  let obj = await TeamMatchPerformance.find({ eventNumber: config.EVENT_NUMBER });

  function countOccurences(array, value, isAuton){
    var count = 0;
    if (isAuton) {
      for(key in array) {
        if (array[key]["id"] == value && array[key]["ts"] < 137000){
          count++;
        }
      }
    } else {
      for(key in array) {
        if (array[key]["id"] == value && array[key]["ts"] > 137000){
          count++;
        }
      }
    }
  }

  for(x in obj) {[
    rows.push(
      obj[x]["scouterId"], //scouter name
      obj[x]["robotNumber"],
      obj[x]["matchNumber"],
      countOccurences(obj[x]["actionQueue"], "broken", true), // auton-broken
      countOccurences(obj[x]["actionQueue"], "leave", true), // auton-leave
      countOccurences(obj[x]["actionQueue"], "penalty", true), // auton-penalty
      countOccurences(obj[x]["actionQueue"], "scoreBall", true), // auton-scoreBall
      countOccurences(obj[x]["actionQueue"], "scoreCrate", true), // auton-scoreCrate
      countOccurences(obj[x]["actionQueue"], "broken", false), // teleop-broken
      countOccurences(obj[x]["actionQueue"], "intakeBall", false), // teleop-intakeBall
      countOccurences(obj[x]["actionQueue"], "launchBall", false), // teleop-launchBall
      countOccurences(obj[x]["actionQueue"], "penalty", false), // teleop-penalty
      countOccurences(obj[x]["actionQueue"], "scoreCrateBottom", false), // teleop-scoreCrateBottom
      countOccurences(obj[x]["actionQueue"], "scoreCrate2nd", false), // teleop-scoreCrate2nd
      countOccurences(obj[x]["actionQueue"], "scoreCrate3rd", false), // teleop-scoreCrate3rd
      countOccurences(obj[x]["actionQueue"], "scoreCrateTop", false), // teleop-scoreCrateTop
    )
  ]}

  //make into csv
  let csv = rows
    .map((row) => row.reduce((acc, value) => acc + `,${value}`))
    .reduce((acc, row) => acc + `${row}\n`, "");
  res.set({ "Content-Disposition": `attachment; filename="teams.csv"` });
  res.send(csv);
});

module.exports = router;
