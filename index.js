require('dotenv').config();
const fetch = require('node-fetch');
const {monkey} = require('./monkey');
const Twit = require('twit');

const timer = 3000;

const T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,

    strictSSL: true
})

async function test()
{
    const url = await monkey();
    if(!url || !url['url']) return test();

    const b64 = await fetch(url['url'])
    .then(res=>res.buffer())
    .then((buffer)=>buffer.toString('base64'))

    T.post('media/upload', { media_data: b64 }, (err, data, res)=>
    {
        const mediaID = data.media_id_string;
        const altText = `Image of monkey; sorry im too lazy to program the alt text`;
        const meta_params = {media_id: mediaID, altText: {text:altText}};

        T.post('media/metadata/create', meta_params, (err, data, res)=>
        {
            if(err) throw err;
            const params = {status: ``, media_ids: [mediaID]};
            
            T.post(`statuses/update`, params, (err,data,res)=>
            {
                if(err) throw err;
            })

        })


    })


}

console.log("Running")

let prevHour = new Date().getHours()-1;

setInterval(()=>
{
    const hour = new Date().getHours();
    if(prevHour != hour)
    {
        prevHour = hour;
        test();        
    }
}, timer)