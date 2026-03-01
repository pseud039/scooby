import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const url = "https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3";

async function scrapeData() {
  try {
    
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "MySearchEngineBot/1.0 (https://example.com; myemail@example.com)",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
const data = response.data;
    const $ = cheerio.load(data);
    const listItems = $(".plainlist ul li");
    const countries = [];
    listItems.each((idx, el) => {
      const country = { name: "", iso3: "" };
      country.name = $(el).children("a").text();
      country.iso3 = $(el).children("span").text();
      countries.push(country);
    });
    console.dir(countries);

    fs.writeFile("countries.json", JSON.stringify(countries, null, 2), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Successfully written data to file");
    });
  } catch (err) {
    console.error(err);
  }
}
scrapeData();