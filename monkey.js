const fetch = require('node-fetch');
const { DataBase } = require('./db');
const DB = new DataBase();
const subreddits = ['monkeys','ape','MonkeyMemes','monkeypics', 'Monke']


let search_term = null;
let google_results = [];
 
 // This is better than trying to connect
 // to the database twice and waiting for the repsonse promise
 
DB.conn().then(async ()=>
{
    const coll = await DB.tablequery("settings");
    if(!coll) return;
    const doc = await coll.toArray();
    search_term = doc[0]['search_terms'];
})


const getrandom = (data) =>
{
    const rm = Math.floor(Math.random()*data.length);
    const rp = data[rm]['data'];

    if(/v\.redd\.\it/.test(rp??['url'])) return getrandom(data);
    return rp;
}

async function fetchDB()
{
    const table = await DB.tablequery('monkey_rankings', {});  // Querying BD
    const array = await table.toArray();                            // Returning results
    const count = await table.count();

    const ranInt = Math.round(Math.random() * count) + 1;
    const ranmonk = array[ranInt];

    return {title: 'monke', 'url': ranmonk['url']}
}

async function fetchreddit()
{
    const random_sr = subreddits[Math.floor(Math.random() * subreddits.length)]
    return await fetch(`https://www.reddit.com/r/${random_sr}.json?&limit=600`).then(async res=>
    {
        if(res.status != 200) return res.status;
        return res.json();
    })
    .then(res=>{
        if(res === parseInt(res, 10) || res['data'] === undefined) return monkey();
        const url = res['data']['children'].filter(post=>!post.data.over_18);
        const valid = url.filter(data=>/jpg|jpeg|png|gif/gmi.test(data['data'].url));
        const rp = getrandom(valid);
        const media = 
        rp['media'] === null ?  rp['url'] : 
        rp['media']['fallback_url'] ? null : 
        (rp['media']['type'] != undefined ? rp['media']['oembed']['thumbnail_url'] : null);
        const formatted = {title: rp['title'], url: media};
        return formatted
    })
    .catch(e=>{throw e});
}


async function handleGoogleResults(res = google_results)
{
    if(res.length < 0) return fetchgoogle();

    if(res[0] === undefined) res.shift();

    const dummy = res[0];
    res.shift();

    return dummy;
}

async function fetchgoogle()
{

    try
    {
        if(!DB.connected()) return;
        // Huge god damn array
        const token = process.env.SEARCH_KEY;
        const randomstart = Math.floor(Math.random()*100);              // Random index start 
        let monkeyvers = Math.floor(Math.random()*search_term.length);   // Random index out of 10 (Max items is 10)
        const searchengine = process.env.SEARCH_ENGINE;                 // Search engine to use (enable global search in control panel)
        let monkey = `monkey ${search_term[monkeyvers]}`;                // Updating search query
        // God damn that's a long url
        const url = `https://www.googleapis.com/customsearch/v1?key=${token}&cx=${searchengine}&q=${monkey}&searchType=image&start=${randomstart}`;
        if(google_results.length > 0) return handleGoogleResults();

        const data = await fetch(url)
        .then(res=>{return res.json()})
        .then((res)=>
        {
            if(res['error'])
            {
                switch(res['error']['code'])
                {
                    case 429:   // Quota exhausted
                        try
                        {
                            quote_reached++;
                            if(quote_reached >= 2) return fetchreddit();
                            else return fetchgoogle();
                        }catch(e)
                        {
                            console.error(e);
                        }
                    break;
                    default: console.log(res['error']);
                }
            }
            res['items'].map((v,i)=>
            {
                google_results.push({title: v['title'], url: v['link']});
            })
            return handleGoogleResults(google_results);
        })
        .catch(e=>console.error(e));
    }catch(e)
    {
        console.error(e);
    }
}

async function monkey()
{
    const random = (Math.floor(Math.random() * 5) + 1) - 1;

    switch(random)
    {
        case 0:
            return fetchreddit();
        case 1:
            return fetchgoogle();
        case 2:
            return fetchDB();
        default: 
            return fetchreddit();
    }
}

module.exports =
{
    monkey
}