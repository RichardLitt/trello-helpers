#!/usr/bin/env node
'use strict'

var moment = require('moment')
var _ = require('lodash')

var Trello = require('node-trello')
var t = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN)

var boardId, targetList, sourceList

var init = function (cb) {
  var resolve = false
  t.get('/1/members/me', function (err, data) {
    if (err) throw err
    data.idBoards.map(function (idBoard) {
      t.get('/1/boards/' + idBoard, {lists: 'all'}, function (err, data) {
        if (err) throw err
        if (data.name === 'Life As She Is Played') {
          boardId = data.id
          data.lists.map(function (list) {
            if (list.name === 'Today') {
              targetList = list.id
            }
            if (list.name === 'Daily Processes') {
              sourceList = list.id
            }
          })
          if (targetList && sourceList && !resolve) {
            resolve = true
            cb(boardId, targetList, sourceList)
          }
        }
      })
    })
  })
}

// Just some ids that are easier to put here directly
var dailyLabel = '55800cca791f5e61d1e67bd5'

// Create a new list for today's date
var today = function () {
  init(function (boardId, targetList, sourceList) {
    t.post('/1/lists', {
      name: moment().format('MMMM Do, YYYY'),
      idBoard: boardId,
      idListSource: sourceList,
      position: '3'
    }, function (err, data) {
      if (err) { throw err }

      // Copy all cards to 'Today'
      t.post('/1/lists/' + data.id + '/moveAllCards', {idBoard: boardId, idList: targetList}, function (err, res) {
        if (err) { throw err }

        console.log('Done')
      })
    })
  })
}

// Delete duplicates
var duplicates = function (listId, dailyOnly) {
  init(function (boardId, targetList, sourceList) {
    listId = listId || targetList
    dailyOnly = dailyOnly || true
    // Get the list of items due Today
    t.get('/1/lists/' + listId, {cards: 'open'}, function (err, data) {
      if (err) throw err

      // Find duplicate cards
      var dupes = _.difference(data.cards, _.uniq(data.cards, 'name'))

      _.each(dupes, function (card) {
        // Only delete daily cards, unless there are other dupes
        if (dailyOnly && _.includes(card.idLabels, dailyLabel)) {
          // Delete duplicate cards
          t.del('/1/cards/' + card.id, function (err, res) {
            if (err) throw err

            console.log('Deleted card: ' + card.name + ' (' + card.id + ')')
          })
        }
      })
    })
  })
}

if (process.argv[2] === 'today') today()
if (process.argv[2] === 't') today()
if (process.argv[2] === 'duplicates') duplicates()
if (process.argv[2] === 'd') duplicates()
if (process.argv[2] === 'dupes') duplicates()
if (process.argv[2] === 'dedupe') duplicates()

module.exports.today = today
module.exports.duplicates = duplicates
