#!/usr/bin/env node
'use strict'

var Trello = require('node-trello')
var Promise = require('bluebird')
var t = Promise.promisifyAll(new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN))
var moment = require('moment')
var _ = require('lodash')
var argv = require('minimist')(process.argv.slice(2))

function findBoard (boardName) {
  return Promise.try(function () {
    return t.getAsync('/1/members/me')
  }).then(function (data) {
    return data.idBoards
  }).map(function (boardId) {
    return t.getAsync('/1/boards/' + boardId, {lists: 'all'})
  }).filter(function (board) {
    return board.name === boardName
  }).then(function (boards) {
    if (boardName === undefined) {
      throw new Error('boardName not set in ENV')
    } else if (boards.length === 0) {
      throw new Error('No results found.')
    } else {
      return boards[0]
    }
  })
}

function getOrCreateList (board, listName) {
  return Promise.filter(board.lists, function (list) {
    return list.name === listName
  }).then(function (lists) {
    if (lists.length > 0) {
      return lists[0]
    } else {
      return createList({
        name: listName,
        board: board,
        position: 'top'
      })
    }
  })
}

function createList (opts) {
  return Promise.try(function () {
    return t.postAsync('/1/lists', {
      name: opts.name,
      idBoard: opts.board,
      idListSource: opts.sourceList,
      position: opts.position
    })
  })
}

function init (boardName) {
  return Promise.try(function () {
    return findBoard(boardName)
  }).then(function (board) {
    return Promise.all([
      getOrCreateList(board, 'Today'),
      getOrCreateList(board, 'Daily Processes')
    ]).spread(function (targetList, sourceList) {
      return {
        boardId: board.id,
        sourceList: sourceList.id,
        targetList: targetList.id
      }
    })
  })
}

var dailyLabel = process.env.TRELLO_LABEL

function createToday () {
  return Promise.try(function () {
    return init(process.env.TRELLO_BOARD)
  }).then(function (result) {
    Promise.try(function () {
      return createList({
        name: moment().format('MMMM Do, YYYY'),
        board: result.boardId,
        sourceList: result.sourceList,
        position: '3'
      })
    }).then(function (list) {
      return t.postAsync('/1/lists/' + list.id + '/moveAllCards', {
        idBoard: result.boardId,
        idList: result.targetList
      })
    }).then(function () {
      console.log('Done')
    })
  })
}

function removeDuplicates (listId, dailyOnly) {
  return Promise.try(function () {
    return init(process.env.TRELLO_BOARD)
  }).then(function (result) {
    if (listId == null) {
      listId = result.targetList
    }

    if (dailyOnly == null) {
      dailyOnly = true
    }

    return Promise.try(function () {
      return t.getAsync('/1/lists/' + listId, {cards: 'open'})
    }).then(function (result) {
      return _.difference(result.cards, _.uniq(result.cards, 'name'))
    }).filter(function (card) {
      return (dailyOnly && _.includes(card.idLabels, dailyLabel))
    }).map(function (card) {
      return Promise.try(function () {
        return t.delAsync('/1/cards/' + card.id)
      }).then(function () {
        console.log('Deleted card: ' + card.name + ' (' + card.id + ')')
      })
    })
  })
}

// This is most likely broken - even when imported as a module, this will still run, and be able to access process.argv...
// Also buggy in that `node bin/index.js t d` will call both immediately.
if (_.intersection(['today', 't'], argv._).length !== 0) {
  createToday()
} else if (_.intersection(['duplicates', 'd', 'dupes', 'dedupe'], argv._).length !== 0) {
  removeDuplicates()
} else {
  console.log('No argument supplied.')
}

module.exports.createToday = createToday
module.exports.removeDuplicates = removeDuplicates
