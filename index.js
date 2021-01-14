require("dotenv").config({ path: __dirname + "/main.env" });

const Discord = require("discord.js");
const bot = new Discord.Client();
const trilogy = require("trilogy");
const db = trilogy.connect("./storage.db", {
  client: "sql.js"
});
const TOKEN = process.env.TOKEN;
const PREFIX = "!";
const stashLogger = "gstash logger";

const itemSchema = {
  name: String,
  users: Array
};

bot.login(TOKEN);

bot.on("ready", async () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on("message", async msg => {
  const items = await db.model("items", itemSchema);
  let user = msg.author;
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
      let newItems = await items.find();
      let userList = [];
      console.log(newItems);
      let result = newItems.filter(i1 =>
        item.toLocaleLowerCase().includes(i1.name.toLowerCase())
      );
      console.log(result);
      result.forEach(i =>
        i.users.forEach(u => console.log(userList.push(u)))
      );
      console.log(userList);
      let uniqueUserList = [... new Set(userList)]
      if (uniqueUserList.length > 0) {
        msg.channel.send("Check the guild stash for your item " + uniqueUserList);
      }
    }
  }

  if (msg.content.startsWith(PREFIX)) {
    console.log("NEW COMMAND");
    await parseCommand(msg.content);
  }
  async function parseCommand(content) {
    console.log("ParseCommand content:" + content);
    const commands = content.trim().split(PREFIX);
    commands.shift();
    console.log("ParseCommand commands:" + commands);
    commands.forEach(async command => {
      await commandMenu(command);
    });
  }
  async function commandMenu(content) {
    console.log("commandMenu content:" + content);
    const options = content.trim().split(/ +/);
    const command = options[0].toLowerCase();

    console.log("COMMAND is ");
    if (command === "iso") {
      console.log("ISO");
      wantedItem = content.slice(4).trim();
      await iso(wantedItem);
    }
    if (command === "list") {
      await listItems(command);
    }
    if (command === "clear") {
      if (options.length > 1) {
        let unwantedItem = content.slice(6).trim();
        await clearItem(unwantedItem);
      } else {
        await clearAllItems();
      }
    }
  }
  //COMMANDS

  async function iso(wantedItem) {
    console.log("WANTED ITEM: " + wantedItem);
    if (!wantedItem.length) {
      msg.channel.send("Thats no item!");
    } else {
      //find the item
      let item = await items.findOne({
        name: wantedItem
      });
      console.log(item);
      if (item) {
        if (item.users.includes(user.toString())) msg.react("📏");
        else {
          item.users.push(user.toString());
          console.log(item);
          await items.update({ name: wantedItem }, { users: item.users });
          msg.channel.send("You are now in search of " + "" + wantedItem + "");
        }
      } else
        await items.create({
          name: wantedItem,
          users: [user.toString()]
        });
      msg.channel.send("You are now in search of " + "" + wantedItem + "");
    }
  }
  async function getAllItemsForUser() {
    allItems = await items.find();
    console.log(allItems);
    let wantedItems = allItems.filter(i => findUserInItem(i));
    console.log(wantedItems);
    return wantedItems;
  }
  async function listItems() {
    let wantedItems = await getAllItemsForUser();
    let wantedItemNames = [];
    wantedItems.forEach(i => wantedItemNames.push(i.name));

    msg.channel.send("You are in search of " + wantedItemNames);
  }
  function findUserInItem(i) {
    if (i.users.includes(user.toString())) return true;
    return false;
  }
  async function clearAllItems() {
    wantedItems = await getAllItemsForUser();
    wantedItems.forEach(async function(i) {
      let newUsers = i.users.filter(e => e != user.toString());
      console.log(newUsers)
      await items.update({ name: i.name }, { users: newUsers });
    });

    msg.channel.send("Your list is cleared");
  }
  async function clearItem(unwantedItem) {
    let item = await items.findOne({
      name: unwantedItem
    });
    console.log("UNWATNED ITEM: " + item);
    if (item != undefined) {
      console.log("UNWATNED ITEM EXISTS");
      if (item.users.includes(user.toString())) {
        let newUsers = item.users.filter(e => e != user.toString());
        item.users = newUsers;
        await items.update({ name: item.name }, { users: item.users });
        msg.channel.send("Removed " + unwantedItem + " from your list!");
      } else
        msg.channel.send(
          "You dont want " + unwantedItem + " according to your list!"
        );
    } else {
      console.log("UNWATNED ITEM DID NOT EXIST");
      await items.create({
        name: unwantedItem,
        users: []
      });
      msg.channel.send(
        "You dont want " + unwantedItem + " according to your list!"
      );
    }
  }
});
