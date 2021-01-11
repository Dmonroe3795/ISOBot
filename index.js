require("dotenv").config({ path: __dirname + "/main.env" });

const Discord = require("discord.js");
const bot = new Discord.Client();
const storage = require("node-persist");
const TOKEN = process.env.TOKEN;
const PREFIX = "!";
const stashLogger = "gstash logger";
console.log(TOKEN);
bot.login(TOKEN);

bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on("message", async msg => {
  await storage.init();
  let user = msg.author;
  console.log(user.toString());
  if ((await storage.getItem(user.toString())) == null) {
    await storage.set(user.toString(), []);
    console.log("added " + user.toString() + "to DB");
  }
  //ITEM WAS ADDED OR REMOVED
  console.log("AUTHOR: " + msg.author.username);
  console.log("STASHLOGGER: " + stashLogger);
  if (msg.author.username === stashLogger) {
    let item = msg.content.substring(
      msg.content.indexOf("'") + 1,
      msg.content.lastIndexOf("'")
    );
    console.log(item);
    if (msg.content.split(" ")[4] === "added") {
      //SEARCH STORAGE FOR AUTHOR AND THEN CHECK ITEM NAME ACROSS THEIR ITEMS-WANTED AND NOTIFY THEM
      let persons = [];
      await storage.forEach(async function(datum) {
        if (datum.value.length > 0 && datum.value.includes(item)) {
          persons.push(datum.key);
        }
      });

      if (persons.length > 0) {
        msg.channel.send("Check the guild stash for your item " + persons);
      }
    }
  }
  //COMMANDS
  if (msg.content.startsWith(PREFIX)) {
    const options = msg.content
      .slice(PREFIX.length)
      .trim()
      .split(/ +/);
    const command = options.shift().toLowerCase();
    console.log("COMMAND is ");
    //adding user to db if they are not in it already
    if (command === "iso") {
      console.log("ISO");
      let wantedItem = msg.content.slice(5).trim();
      console.log("WANTED ITEM: " + wantedItem);
      if (wantedItem.length < 1) {
        msg.channel.send("Thats no item!");
      } else {
        let wantedItems = await storage.get(user.toString());
        if (wantedItems.includes(wantedItem)) {
          msg.react("📏");
        } else {
          wantedItems.push(wantedItem);
          await storage.set(user.toString(), wantedItems);
          msg.channel.send(
            "You are now in search of " + "[[" + wantedItem + "]]"
          );
        }
      }
    }
    if (command === "list") {
      console.log("list");
      let wantedItems = await storage.get(user.toString());
      msg.channel.send("You are in search of " + wantedItems);
    }
    if (command === "clear") {
      console.log("clear");
      await storage.set(user.toString(), []);
      msg.channel.send("Your list is cleared");
    }
  }
});
