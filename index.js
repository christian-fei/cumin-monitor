const express = require('express')
const Async = require('async')
const assert = require('assert')
const redis = require('redis').createClient()
const app = express()
const server = require('http').createServer(app)
const {join} = require('path')

app.use(express.static(join(__dirname, '/public')))
server.listen(1337)

var connectedClients = []

app.get('/', function (req, res) {
  res.sendfile(join(__dirname, '/public/index.html'))
})

app.get('/stream', function (req, res, next) {
  connectedClients.push(res)

  res.writeHead(200, {
    'content-type': 'text/event-stream'
  })

  getQueues(function (err, queues) {
    if (err) return next(err)

    res.write('event: queues\ndata: ' + JSON.stringify(queues) + '\n\n')
  })

  req.on('close', function () {
    connectedClients.splice(connectedClients.indexOf(res), 1)
  })
})

function getQueues (done) {
  getQueueNames(function (err, queues) {
    if (err) return done(err)

    Async.map(queues, getQueueDetails, done)
  })
}

function getQueueNames (done) {
  redis.smembers('cuminqueues', done)
}

function getQueueDetails (queueName, done) {
  Async.parallel([
    function (done) { redis.hgetall('cuminmeta.' + queueName, done) },
    function (done) { redis.llen('cumin.' + queueName, done) }
  ], function (err, data) {
    if (err) return done(err)

    var queueInfo = data[0]
    queueInfo.name = queueName
    queueInfo.count = data[1]
    queueInfo.now = Date.now()
    done(null, queueInfo)
  })
}

setInterval(function () {
  if (!connectedClients.length) return

  getQueues(function (err, queues) {
    assert.ifError(err)
    var queuesStringified = JSON.stringify(queues)

    connectedClients.forEach(function (client) {
      client.write('event: update\ndata: ' + queuesStringified + '\n\n')
    })
  })
}, 1000)
