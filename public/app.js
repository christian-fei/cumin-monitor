var source

function setup () {
  source = new EventSource('stream')

  source.addEventListener('queues', function (evt) {
    var queues = JSON.parse(evt.data)

    queues.sort(function (queue1, queue2) { return (queue1.name < queue2.name) ? -1 : (queue1.name > queue2.name ? 1 : 0) })

    var frag = document.createDocumentFragment()

    var frag = queues.reduce(function (frag, queue) {
      frag.appendChild(createQueueNode(queue))
      return frag
    }, document.createDocumentFragment())

    document.getElementById('pageLoading').style.display = 'none'
    document.getElementById('queueBlocks').innerHTML = ''
    document.getElementById('queueBlocks').appendChild(frag)
  }, false)

  source.addEventListener('update', function (evt) {
    var queues = JSON.parse(evt.data)

    queues.forEach(function (queueItem) {
      var node = document.querySelector("div[data-queue-name='" + queueItem.name + "']")

      if (node) {
        var $ = function (x) { return node.querySelector(x) }

        if ($('.leftOfQueue .date').getAttribute('data-lastActivity') != queueItem.lastEnqueued) {
          $('.leftOfQueue .arrow').classList.add('pulse')
          $('.leftOfQueue .date').setAttribute('data-lastActivity', queueItem.lastEnqueued)
        }
        $('.leftOfQueue .date').innerHTML = timeDifference(queueItem.now, queueItem.lastEnqueued)

        if ($('.rightOfQueue .date').getAttribute('data-lastActivity') != queueItem.lastDequeued) {
          $('.rightOfQueue .arrow').classList.add('pulse')
          $('.rightOfQueue .date').setAttribute('data-lastActivity', queueItem.lastDequeued)
        }
        $('.rightOfQueue .date').innerHTML = timeDifference(queueItem.now, queueItem.lastDequeued)

        $('.queueLength').innerHTML = formatCount(queueItem.count)
      } else {
        window.location.reload()
      }
    })
  }, false)
}

setup()

function togglePause () {
  var button = document.getElementById('pauseGlyph')

  if (source.readyState !== 2) {
    source.close()
    delete window.source
    button.classList.remove('icon-pause')
    button.classList.add('icon-play')
    button.parentNode.classList.add('btn-warning')
  } else {
    setup()
    button.classList.add('icon-pause')
    button.classList.remove('icon-play')
    button.parentNode.classList.remove('btn-warning')
  }
}

document.body.addEventListener('webkitAnimationEnd', function (ev) {
  ev.target.classList && ev.target.classList.remove('pulse')
})

function cleanupQueue (queue) {
  queue.lastEnqueued = queue.lastEnqueued || 0
  queue.lastDequeued = queue.lastDequeued || 0
  return queue
}

function createQueueNode (queue) {
  var div = document.createElement('div')
  div.innerHTML = document.getElementById('queueTemplate').innerHTML

  var $ = function (x) { return div.querySelector(x) }
  $('.queueBlock').setAttribute('data-queue-name', queue.name)
  $('.leftOfQueue .date').innerHTML = queue.lastEnqueued ? timeDifference(queue.now, queue.lastEnqueued) : ''
  $('.leftOfQueue .date').setAttribute('data-lastActivity', queue.lastEnqueued)
  $('.rightOfQueue .date').innerHTML = queue.lastDequeued ? timeDifference(queue.now, queue.lastDequeued) : ''
  $('.rightOfQueue .date').setAttribute('data-lastActivity', queue.lastDequeued)
  $('h3').innerHTML = queue.name
  $('h2').innerHTML = formatCount(queue.count)

  return div.childNodes[1]
}

function formatCount (count) {
  return "<span style='color: " +
		(count < 50 ? '#468847' : count < 150 ? '#f89406' : '#b94a48') +
		"'>" + count + '</span>'
}

function timeDifference (current, previous) {
	// From: http://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
  var msPerMinute = 60 * 1000
  var msPerHour = msPerMinute * 60
  var msPerDay = msPerHour * 24
  var msPerMonth = msPerDay * 30
  var msPerYear = msPerDay * 365

  var elapsed = current - previous

  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + ' seconds ago'
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + ' minutes ago'
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + ' hours ago'
  } else if (elapsed < msPerMonth) {
    return 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago'
  } else if (elapsed < msPerYear) {
    return 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago'
  } else {
    return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago'
  }
}
