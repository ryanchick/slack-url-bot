const Botkit = require('botkit');
const fs = require('fs');
const urlRegex = '(https?:\\/\\/(?:www\\.|(?!www))[^\\s\.]+\\.[^\\s]{2,}|www\\.[^\\s]+\\.[^\\s]{2,})'

let courses = [];

/*
data structure for urls: {
    url:STRING,
    username:STRING,
    channel:STRING,
    city:STRING,
    team:STRING
}*/

//get course/token info from a file
courses = JSON.parse(fs.readFileSync('courseInfo.json','utf8'));
// console.log(courses)

let activeCourses = courses.filter(course => course.active);
// console.log(activeCourses)
activeCourses.forEach(course => {
    let {token, team, city} = course;
    //Init botkit controller
    const controller = Botkit.slackbot({
        debug: false,
        stats_optout: true
    });

    //
    const bot = controller.spawn({
        token: token
    }).startRTM();

    //Get team name if left blank
    if(team === ""){
        bot.api.team.info({}, (err, teamInfo) => {
            console.log(teamInfo.team);
            team = teamInfo.team.name
        })
    }

    //Testing the bot
    controller.hears(['!listchannels'],'direct_message', (bot, message) => {
        bot.api.channels.list({},(err, info) => {
            console.log(info.channels)
            bot.reply(message, `There are ${info.channels.length} public channels in this team.`)
        })
    })

    controller.hears(['!identify'],'direct_message,direct_mention', (bot,message) => {
        console.log(bot.identity);
        bot.reply(message, `I am ${bot.identity.name}. I am always watching.`)
    })

    controller.hears(['who are you'],'direct_message,direct_mention', (bot,message) => {
        console.log(message);
        bot.reply(message, `Remain calm. There is nothing to fear.`)
    })
    

    // BOTS can't join channels (even public) through API, will need to be invited
    // controller.hears(['!joinchannels'],'direct_message', (bot,message) => {
    //     console.log(message)
    //     bot.api.channels.join({name:'general'},(err,info) => {
    //         console.log(info)
    //     })
    // })

    controller.hears([urlRegex],'mention,direct_mention,ambient', (bot, message) => {
        //remove '>' at end since slack adds '< >' to urls
        let url = message.match[0].slice(0,-1);
        console.log(url);
        // console.log(message)
        //get username
        bot.api.users.info({user: message.user}, (err, userInfo) => {
            //get channel (checks public channels first)
            bot.api.channels.info({channel:message.channel}, (err, channelInfo) => {
                console.log(channelInfo)
                //if channel not found, check in private channels (aka groups)
                if(channelInfo.ok === false){
                    bot.api.groups.info({channel:message.channel}, (err, groupInfo) => {
                        console.log(groupInfo)
                        let newObj = {
                            url,
                            username:userInfo.user.name,
                            channel:groupInfo.group.name,
                            city,
                            team
                        }
                        console.log(newObj)
                    })
                } else {
                    let newObj = {
                        url,
                        username:userInfo.user.name,
                        channel:channelInfo.channel.name,
                        city,
                        team
                    }
                    console.log(newObj)
                }
            })
            
        })

    })
});

