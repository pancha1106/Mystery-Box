const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");

const fs = require("fs");
const config = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let data = require("./data.json");

// --- SAVE DATA ---
function saveData() {
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// --- RANDOM CHANNEL ---
function getRandomChannel() {
    return config.channels[Math.floor(Math.random() * config.channels.length)];
}

// --- RANDOM INTERVAL ---
function getRandomInterval() {
    return config.spawnIntervals[Math.floor(Math.random() * config.spawnIntervals.length)];
}

// --- RANDOM REWARD ---
function getReward() {
    const rewards = [
        { type: "Coins", value: 100 },
        { type: "Coins", value: 250 },
        { type: "XP", value: 500 },
        { type: "Gems", value: 10 },
        { type: "Tickets", value: 1 },
        { type: "VIP", value: "1 day" },
        { type: "Role", value: "Lucky Winner" }
    ];

    return rewards[Math.floor(Math.random() * rewards.length)];
}

// --- SPAWN BOX ---
async function spawnBox(debug = false) {
    if (data.activeBox) return;

    const channelId = getRandomChannel();
    const channel = await client.channels.fetch(channelId);

    const embed = new EmbedBuilder()
        .setTitle("🎁 Mystery Box Appeared!")
        .setDescription("A mysterious box has spawned! Be the first to open it!")
        .setColor("Gold");

    const button = new ButtonBuilder()
        .setCustomId("open_box")
        .setLabel("🎁 Open Mystery Box")
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({ embeds: [embed], components: [row] });

    data.activeBox = true;
    data.channelId = channelId;
    saveData();

    console.log(`📦 Box spawned in: ${channel.name}`);

    if (debug) {
        console.log("DEBUG CHANNEL ID:", channelId);
    }

    setTimeout(() => spawnBox(true), getRandomInterval());
}

// --- BUTTON HANDLER ---
client.on("interactionCreate", async interaction => {

    if (interaction.isButton()) {

        if (interaction.customId === "open_box") {

            if (!data.activeBox) {
                return interaction.reply({ content: "❌ Box jau ir paņemts!", ephemeral: true });
            }

            const reward = getReward();

            data.activeBox = false;
            data.channelId = null;
            saveData();

            if (reward.type === "Role") {
                const role = interaction.guild.roles.cache.find(r => r.name === reward.value);
                if (role) {
                    await interaction.member.roles.add(role);
                }
            }

            const winEmbed = new EmbedBuilder()
                .setTitle("🎉 Mystery Box Opened!")
                .setDescription(`${interaction.user} got **${reward.type}: ${reward.value}**`)
                .setColor("Green");

            return interaction.update({
                embeds: [winEmbed],
                components: []
            });
        }
    }
});

// --- !testspawn COMMAND ---
client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (message.content === "!testspawn") {

        await spawnBox(true);

        message.reply("✅ Test Mystery Box spawned!");
    }
});

// --- READY ---
client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    setTimeout(() => spawnBox(true), 5000);
});

client.login(config.token);
