require('dotenv').config();
const { MongoClient } = require('mongodb');
const password = process.env.DBPASS || 'Your password here';
const dbname = process.env.DBNAME || 'Your db name here';
const clustername = process.env.DBCLUSTER || 'Your cluster here';

const url = `mongodb+srv://admin:${password}@${dbname}.xbm61.mongodb.net/${clustername}?retryWrites=true&w=majority`

/**
 * @classdesc Wrapper for MongoDB because I hate the mongoose wrapper. Why do you need schemas??????????
 */
module.exports.DataBase = class DataBase
{
    constructor()
    {
        this.client = new MongoClient(url, { useUnifiedTopology: true } );
        this.db = null;
        this.dbinfo = null;
    }

    client()
    {
        return this.client;
    }

    connected()
    {
        return this.db === null ? false : true;
    }

    async db()
    {
        return this.client;
    }

    /**
     * Accepts:
     *  - Tables
     * @param {String} args what to grab
     * @param {String[]} options Optional arguments
     * @example DB.get('tables')
     */
    async get(args, ...options)
    {
        const test = (query) => {return (new RegExp(`^${query}$`)).test(args)}
        switch(true)
        {
            case test('tables'):
                return await this.tables();
            break;
            case test('table'):
                return await this.table(args);
            break;
            default:
                return null;
        }
    }

    /**
     * You need to await this function when calling since we are
     * connecting to the server and requesting the Collections (Tables)
     * @async
     * @returns {String[]}
     */
    async tables()
    {
        return await this.db.listCollections().toArray();
    }


    async update(coll, query = {}, update = {}, options = {})
    {
        coll.findOneAndUpdate(query,update,options);
    }

    async table(coll)
    {
        return await this.db.collection(coll);
    }

    /**
     * 
     * @param {*} collection Table to query
     * @param  {{}} query Query selector
     */
     async tablequery(coll, query = {})
    {
        try
        {
            return await this.db.collection(coll).find(query);
        }
        catch(e)
        {
            console.log(`${e.message}`);
        }
    }

    /**
     * 
     * @param {String} collection name of collection 
     * @param {Array} data 
     */
    insertinto(collection = null, data = null)
    {
        if(!(collection || data)) throw collection || data;
        if(typeof(collection) !== "string") return;
        this.db.collection(collection).insertOne(data)
    }
    

    /**
     * @description Connects our worker to an Atlas Server
     * @augments this.db With database entry point
     */
    conn()
    {
        return new Promise((resolve, rej)=>
        {
            this.client.connect((err, res)=>
            {
                if(err) throw err
                resolve(true)
                console.log('Connected to database')
                this.db = res.db();
            })
        })
    }

    close()
    {
        return new Promise((resolve, rej)=>
        {
            this.client.logout((err, res)=>
            {
                if(err) throw err
                resolve(true)
                console.log('Disconnected from database')
            })
        })
    }
}