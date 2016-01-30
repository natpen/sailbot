# Sailbot

Get email notifications whenever boats matching custom search criteria get posted to [www.sailboatlistings.com](http://www.sailboatlistings.com). Built mostly as an excuse to mess around with [launchd](https://en.wikipedia.org/wiki/Launchd).

### Installation

1. `git clone https://github.com/natpen/sailbot.git`
2. `cd sailbot`
3. `mv .env.example .env`
4. Edit `.env` and put in your own credentials
5. Edit `local.sailbot.plist.example` and change paths containing my username (natpen) to instead contain whatever your username is
5. `mv local.sailbot.plist.example ~/Library/LaunchAgents/local.sailbot.plist`

That's all there is to it! You should get emails in the mornings if there are any new matches. The first time the program runs, it will look back over the last month. After that, it will keep track of when it last ran and only notify of new matches.

If you want to trigger a run immediately after installation and get your sailboats delivered to your inbox RIGHT MEOW, simply run the following command:

`launchctl load ~/Library/LaunchAgents/local.sailbot.plist`

### Bonus points: centralize your launchd configurations!

I provided `local.sailbot.plist.example` in this repository to help get things running, but for better better organization of launchd tasks, I've started centralizing and managing launchd task configurations and log output in [their own repository](https://github.com/natpen/launchd). Check it out for more details!

### Changing the filter criteria

You can easily change the filtering criteria towards the bottom of `index.js` if you'd like! Look in the `listingMatchesCriteria` function for the relevant logic.

### Troubleshooting

TODO.
