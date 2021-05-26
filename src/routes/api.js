const express = require("express");
const pg = require("pg");
const { Client } = require("pg");
const client = new Client({
  connectionString:
    "postgres://xdtgcxetjzbmkr:6c083aaf4ce5da274ac0d63e43a6b30a2b2227c3af1c7c16ef0a7357dfeb5d9b@ec2-18-214-208-89.compute-1.amazonaws.com:5432/d1nnj41uc9m4cn",
  ssl: {
    rejectUnauthorized: false,
  },
});
var ans = {
  datetime: [],
  temperature: [],
  humidity: [],
  luminosity: [],
  dust10: [],
  dust25: [],
  dust100: [],
};
try {
  client.connect();
  console.log("Successfully connected");
} catch (e) {
  console.log(e);
}

pg.types.setTypeParser(1114, (str) => str); // forcing timestamp to be str

const router = express.Router();

router.get("/api", async (req, res) => {
  //  date_to , date_from
  //  GET /something?date_to=DATE&date_from=DATE&type=hours/days/months&payload=value
  //  type: single ; hourly ; daily ; monthly

  let type = req.query.type;

  // First update
  if (type == "single") {
    try {
      const resp = await client.query(
        "SELECT * FROM estacao ORDER BY datetime DESC LIMIT 1"
      );
      res.send(JSON.stringify(resp.rows[0]));
      return;
    } catch (err) {
      console.log("Error: ", err.stacks);
      res.send("Error on getting data");
      return;
    }
  }

  // Date variables used above
  let date = req.query.date_from;
  let date_from;
  let date_to;

  if (type == "minutly") {
    let minutes_interval = parseInt(req.query.payload);
    let minutes_in_a_day = 1440;
    let interval = minutes_in_a_day / minutes_interval;
    let m = 0;
    let h = 0;
    date = date.slice(0, 10);
    for (let i = 0; i < interval; i++) {
      m += minutes_interval;
      if (m == 60) {
        h++;
        date_from =
          date +
          ` ${numberFormater(h - 1)}:${numberFormater(
            m - minutes_interval
          )}:00`;

        if (h == 24) h = 0;
        date_to = date + ` ${numberFormater(h)}:${numberFormater(0)}:00`;
        m = 0;
      } else {
        date_from =
          date +
          ` ${numberFormater(h)}:${numberFormater(m - minutes_interval)}:00`;
        date_to = date + ` ${numberFormater(h)}:${numberFormater(m)}:00`;
      }

      await requestAvg(date_from, date_to, date_to);
    }
    return res.send(ans);
  }

  if (type == "hourly") {
    try {
      for (let i = 0; i < 24; i++) {
        if (i < 10) {
          date_from = `${date} 0${i}:00:00`;
          date_to = `${date} 0${i}:59:59`;
        } else {
          date_from = `${date} ${i}:00:00`;
          date_to = `${date} ${i}:59:59`;
        }

        await requestAvg(date_from, date_to, date_from);
      }

      res.send(ans);
      resetAns();
      return;
    } catch (err) {
      res.send(err.stack);
      console.log(err.stack);
      return;
    }
  }

  let days_per_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (type == "daily") {
    let current_month = date.slice(5, 7);
    let current_month_int = parseInt(current_month);
    let current_year = date.slice(0, 4);

    for (let i = 1; i < days_per_month[current_month_int - 1] + 1; i++) {
      if (i < 10) {
        date_from = current_year + `-${current_month}-0${i}` + " 00:00:00";
        date_to = current_year + `-${current_month}-0${i}` + " 23:59:59";
      } else {
        date_from = current_year + `-${current_month}-${i}` + " 00:00:00";
        date_to = current_year + `-${current_month}-${i}` + " 23:59:59";
      }

      await requestAvg(date_from, date_to, date_from.slice(0, 10));
    }

    res.send(ans);
    resetAns();
  }

  if (type == "monthly") {
    try {
      let current_year = date.slice(0, 4);
      for (let i = 1; i < 12; i++) {
        if (i < 10) {
          date_from = current_year + `-0${i}-` + "01" + " 00:00:00";
          date_to =
            current_year + `-0${i}-` + days_per_month[i - 1] + " 23:59:59";
        } else {
          date_from = current_year + `-${i}-` + "01" + " 00:00:00";
          date_to =
            current_year + `-${i}-` + days_per_month[i - 1] + " 23:59:59";
        }

        await requestAvg(date_from, date_to, date_from.slice(0, 7));
      }

      res.send(ans);
      resetAns();
      return;
    } catch (err) {
      res.send(err.stack);
      console.log(err.stack);

      return;
    }
  }
});

router.post("/api", async (req, res) => {
  let data = req.body;
  let db_query_values = Object.values(data);

  try {
    const resp = await client.query(
      "INSERT INTO estacao (device,datetime,temperature,humidity,dewpoint,absolutehumidity,pressure,luminosity,co2,dust10,dust25,dust100,dataid) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
      db_query_values
    );
    console.log("enviado para o db");
    req.io.emit("update_data", data);
    return res.send(resp.rows[0]);
  } catch (err) {
    console.log("error");
    console.log(err.stack);
    return res.send(err.stack);
  }
});

async function requestAvg(date_from, date_to, date_control) {
  try {
    ans["datetime"].push(date_control);
    const resp = await client.query(
      `SELECT  AVG(temperature) AS temperature, AVG(humidity) AS humidity ,AVG(luminosity) AS luminosity, AVG(dust10) AS dust10, AVG(dust25) AS dust25, AVG(dust100) AS dust100 FROM estacao WHERE datetime BETWEEN '${date_from}' AND '${date_to}'`
    );

    resp.rows.forEach((data) => {
      for (prop in data) {
        // Verifying if its a number in order to round it
        let inp = data[prop];
        if (inp === null || isNaN(parseFloat(inp.toString()))) {
          ans[prop].push(inp);
        } else {
          ans[prop].push(inp.toFixed(2));
        }
      }
    });
    return;
  } catch (err) {
    console.log(err);
    return;
  }
}

function resetAns() {
  ans = {
    datetime: [],
    temperature: [],
    humidity: [],
    luminosity: [],
    dust10: [],
    dust25: [],
    dust100: [],
  };
  return;
}

function numberFormater(n) {
  if (n < 10) {
    return `0${n}`;
  } else {
    return `${n}`;
  }
}
module.exports = router;
