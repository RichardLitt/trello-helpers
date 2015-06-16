var Trello = require('node-trello')
var t = new Trello('81aff9b457de638bc94d7bb2a6d99816', '32cf5bb650eda2702c6d87a797799428ba77e0d9962fe795552ee698124a2a9e')
var moment = require('moment')

if (process.argv[2] === 'today') module.exports.today()

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

var dailyProcessesId = '5530c897180c432f729fbf85'
var lifeAsSheIsPlayedId = '533c26d99c90c43936a3c499'
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
module.exports.today = function () {
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
module.exports.duplicates = function duplicates (listId) {
  listId = listId || todayId
  t.get('/1/lists/' + listId, {cards: 'open'}, function (err, data) {
    if (err) {
      throw err
    }

    var cards = data.cards.sort(function (a, b) {
      return a.name.localeCompare(b.name)
    })

    var cardNames = cards.map(function (card) {
      return card.name
      // if (card.closed === false) {
      //   console.log(card.name, card.id)
      // }
    })

    // console.log(cardNames)

  })
}
