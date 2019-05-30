const TwitchJS = require("twitch-js").default;
const OBSWebSocket = require('obs-websocket-js');
const messages = require("./messages.js");
const timers = require("./timers.js");

const {
    twitchClientId,
    twitchOAuth,
    twitchUserName,
    twitchChannel
} = require("./config.js");

const obs = new OBSWebSocket();
obs.connect({ address: 'localhost:4444', }).catch((err) => console.error(err));

const {api, chat, chatConstants} = new TwitchJS({
    token: twitchOAuth,
    username: twitchUserName,
    clientId: twitchClientId,
});


chat.connect().then(() => {
    chat.join(twitchChannel).catch((err) => console.error(err));
    chat.on("PRIVMSG", (msg) => handleMsg(msg));

    timers.forEach((timer) => {
        setInterval(() => {chat.say(twitchChannel, timer.do())}, 1000 * 60 * timer.every);
    })

}).catch((err) => {console.error(err)});


// CHAT TRIGGERED
function handleMsg(msg) {
    if (msg.isSelf) {return} // ignore messages the bot is sending

    // CAMERA SWITCHING
    if (msg.message.startsWith("!maincam")) {
        console.info("Switching to maincam");
        obs.send("SetCurrentScene", {"scene-name": "maincam"}).catch((err) => console.error(err));
        return;
    }
    if (msg.message.startsWith("!rearcam")) {
        console.info("Switching to rearcam");
        obs.send("SetCurrentScene", {"scene-name": "rearcam"}).catch((err) => console.error(err));
        return;
    }

    // HELP MESSAGE
    if (msg.message.startsWith("!opal")) {
        var commands = "Available commands: ";
        Object.keys(messages).forEach((command) => {
            commands += command += " ";
        })
        chat.say(twitchChannel, commands).catch((err) => console.error(err));
        return;
    }

    // TEXT MESSAGES
    for (const [command, message] of Object.entries(messages)) {
        if(msg.message.startsWith(command)) {
            chat.say(twitchChannel, message).catch((err) => console.error(err));
            return;
        }
    }
}

