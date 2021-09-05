const express = require('express')
const app = express()
const port = 3000
var http = require('http')
var soap = require('soap');
var bodyParser = require('body-parser')
var xml = require('fs').readFileSync('myservice.wsdl', 'utf8');
//http server example

var server = http.createServer(function(request,response) {
    response.end('404: Not Found: ' + request.url);
});

const kue = require('kue');
const queue = kue.createQueue({
    redis: {
        port: 6379,
        host: '127.0.0.1',
        auth: '',
        db: 3, // if provided select a non-default redis db
        options: {
            // see https://github.com/mranney/node_redis#rediscreateclient
        }
    }
});
var kueUiExpress = require('kue-ui-express');

var stid = {
    STID_activity: {
        PortTypeEndpoint0: {
            Activity : async function (args, cb, headers, req) {
                // console.log("stid activity", args.UID)
                let response  = {}
                args.title= 'activity truck Plat: '+args.Plat_No + ' No Request: '+args.No_Request
                const job = queue.create('activity_truck', args)
                job.on('failed', (err) => {
                    console.log(err, "error coy") //nilai kembalian error akan dipassing disini.
                })
                job.on('complete', (result) => {
                    response = result
                    // console.log("sip",result) //nilai kembalian jika sukses akan dipassing disini.
                    return result
                })
                job.on('progress', function(progress, data){
                    console.log('\r  job #' + job.id + ' ' + progress + '% complete with data ', data );
                });
                job.log('sent to');

                job.save(function (err) {
                    console.log(job.id)
                })

                return {
                    Card_Number : args.Card_Number,
                    Activity_Type : args.Activity_Type,
                    Response_Code : "",
                    Response_Message : "",
                    Response_Date : ""
                }
            },
        }
    }
};

queue.process('activity_truck', (job, done) => {
    done(null, job.data)
});

server.listen(8000);
server.log = function(type, data) {
    console.log("accept")
};
soap.listen(server, '/wsdl', stid, xml, function(){
    console.log('server initialized sue');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
app.use('/kue-api/', kue.app);
app.use( kue.app );
