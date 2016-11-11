const Botkit = require('botkit');
const fs = require('fs');
const urlRegex = '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'

let courses = [];

courses = JSON.parse(fs.readFileSync('courseInfo.txt','utf8'));

let activeCourses = courses.filter(course => course.active);

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
            console.log(teamInfo);
            team = teamInfo.team.name
        })
    }

    controller.hears(['!listchannels'],'direct_message', (bot, message) => {
        console.log(message);
        bot.api.channels.list({},(err, info) => {
            console.log(info)
            console.log(info.channels.length)
            bot.reply(message, `There are ${info.channels.length} channels in this team.`)
        })
    })

    controller.hears(['!identify'],'direct_message', (bot,message) => {
        console.log(bot.identity);
        bot.reply(message, `I am ${bot.identity.name}. I am always watching.`)
    })
    

    // BOTS can't join channels (even public) through API, will need to be invited
    // controller.hears(['joinchannels'],'direct_message', (bot,message) => {
    //     console.log(message)
    //     bot.api.channels.join({name:'general'},(err,info) => {
    //         console.log(info)
    //     })
    // })

    controller.hears([urlRegex],'mention,direct_mention,direct_message,ambient', (bot, message) => {
        console.log(message);
        //get username
        bot.api.users.info({user: message.user}, (err, userInfo) => {
            //get channel (checks public channels first)
            bot.api.channels.info({channel:message.channel}, (err, channelInfo) => {
                console.log(channelInfo.channel.name)
                //if channel not found, check in private channels
                if(channelInfo.ok === false){
                    bot.api.groups.info({channel:message.channel}, (err, groupInfo) => {
                        console.log(groupInfo)
                        let newObj = {
                            url:message.match[0].slice(0,-1),
                            username:userInfo.user.name,
                            channel:groupInfo.group.name,
                            city:city,
                            team:team
                        }
                        console.log(newObj)
                    })
                } else {
                    let newObj = {
                        url:message.match[0].slice(0,-1),
                        username:userInfo.user.name,
                        channel:channelInfo.channel.name,
                        city:city,
                        team:team
                    }
                    console.log(newObj)
                }
            })
            
        })

    })
});
