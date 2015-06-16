var Trello = require('node-trello')
var t = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN)
var moment = require('moment')
var _ = require('lodash')

// t.get('/1/members/me', function (err, data) {
//   if (err) throw err

//   data.idBoards.map(function (idBoard) {
//     t.get('/1/boards/' + idBoard, {lists: 'all'}, function (err, data) {
//       if (data.name === 'Life As She Is Played') {
//         data.lists.map(function (list) {
//           if (list.name === 'Today') {
//             console.log(list.name, list.id)

//           }
//         })
//       }

//     })
//   })

//   // console.log(data)
// })

var lifeAsSheIsPlayedId = '533c26d99c90c43936a3c499'
var dailyProcessesId = '5530c897180c432f729fbf85'
var todayId = '549ccb04f68aa6f4657b5d04'

// function unique (array) {
//   var seen = new Set()
//   return array.filter(function (item) {
//     if (!seen.has(item)) {
//       seen.add(item)
//       return true
//     }
//   })
// }

// Create a new list for today's date
var today = function () {
  t.post('/1/lists', {
    name: moment().format('MMMM Do, YYYY'),
    idBoard: lifeAsSheIsPlayedId,
    idListSource: dailyProcessesId,
    position: '3'
  }, function (err, data) {
    if (err) { throw err }

    // Copy all cards to 'Today'
    t.post('/1/lists/' + data.id + '/moveAllCards', {idBoard: lifeAsSheIsPlayedId, idList: todayId}, function (err, res) {
      if (err) { throw err }

      console.log('Done')
    })
  })
}

// Delete duplicates
var duplicates = function (listId, dailyOnly) {
  listId = listId || todayId
  dailyOnly = dailyOnly || true
  // Get the list of items due Today
  t.get('/1/lists/' + listId, {cards: 'open'}, function (err, data) {
    if (err) throw err

    // Find duplicate cards
    var dupes = _.difference(data.cards, _.uniq(data.cards, 'name'))

    _.each(dupes, function (card) {
      // Only delete daily cards, unless there are other dupes
      if (dailyOnly && _.includes(card.idLabels, '55800cca791f5e61d1e67bd5')) {
        // Delete duplicate cards
        t.del('/1/cards/' + card.id, function (err, res) {
          if (err) throw err

          console.log('Deleted card: ' + card.name + ' (' + card.id + ')')
        })
      }
    })

  })
}

if (process.argv[2] === 'today') today()
if (process.argv[2] === 't') today()
if (process.argv[2] === 'duplicates') duplicates()
if (process.argv[2] === 'd') duplicates()
if (process.argv[2] === 'dupes') duplicates()
if (process.argv[2] === 'dedupe') duplicates()

// module.exports.today = today()
// module.exports.duplicates = duplicates()
