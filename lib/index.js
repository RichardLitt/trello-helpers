'use strict'

var Trello = require('node-trello')
var Promise = require('bluebird')
var moment = require('moment')
var _ = require('lodash')

module.exports = function initializeModule (options) {
  var t = Promise.promisifyAll(new Trello(options.trelloKey, options.trelloToken))
  var dailyLabel = options.trelloLabel

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
    }).catch(function (err) {
      console.log('Error finding board', err)
    })
  }

  function getOrCreateList (board, listName) {
    return Promise.filter(board.lists, function (list) {
      return list.name === listName
    }).filter(function (list) {
      return list.closed === false
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
    }).catch(function (err) {
      console.log('Error in getOrCreateList', err)
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
    }).catch(function (err) {
      console.log('Error creating list', err)
    })
  }

  function moveCardPosition (opts) {
    return Promise.try(function () {
      return t.getAsync('/1/lists/' + opts.targetList, {cards: 'open'})
    }).then(function (result) {
      return result.cards
    }).filter(function (card) {
      return (opts.dailyOnly && _.includes(card.idLabels, opts.dailyLabel))
    }).map(function (card) {
      return Promise.try(function () {
        return t.putAsync('/1/cards/' + card.id, {pos: opts.pos})
      }).then(function () {
        console.log('Copied card: ' + card.name)
      })
    }).catch(function (err) {
      console.log('Error in moveCardPosition', err)
    })
  }

  function init (boardName, listName) {
    return Promise.try(function () {
      return findBoard(boardName)
    }).then(function (board) {
      return Promise.all([
        getOrCreateList(board, (listName ? listName : 'In')),
        getOrCreateList(board, 'Daily Processes')
      ]).spread(function (targetList, sourceList) {
        return {
          boardId: board.id,
          targetList: targetList.id,
          sourceList: sourceList.id
        }
      })
    }).catch(function (err) {
      console.log('Error initiating', err)
    })
  }

  function getOpenLists () {
    return Promise.try(function () {
      return findBoard(options.trelloBoard)
    }).then(function (board) {
      return Promise.filter(board.lists, function (list) {
        return list.closed === false
      })
    }).catch(function (err) {
      if (err) throw new Error('Unable to get lists')
    })
  }

  /* Print all open list names from the default baord */
  function getLists () {
    return Promise.try(function () {
      return getOpenLists()
    }).then(function (lists) {
        return lists.forEach(function (list) {
          console.log(list.name)
          return list.name
        })
      }).catch(function (err) {
        if (err) throw new Error('Could not list list names')
      })
  }

  /* Print out open cards from a given list */
  function listCards (listName) {
    return Promise.try(function () {
      return getOpenLists()
    }).filter(function (list) {
      return list.name === listName
    }).then(function (list) {
      return t.getAsync('/1/lists/' + list[0].id, {cards: 'open'})
    }).then(function (list) {
      return list.cards.forEach(function (card) {
        console.log(card.name)
      })
    }).catch(function (err) {
      if (err) throw new Error('Could not find list')
    })
  }

  /* Labels all cards from a given list */
  function labelCards (listName, labelName) {
    return Promise.try(function () {
      return getOpenLists()
    }).filter(function (list) {
      return list.name === listName
    }).then(function (list) {
      return t.getAsync('/1/lists/' + list[0].id, {cards: 'open'})
    }).then(function (list) {
      Promise.try(function () {
        return findBoard(options.trelloBoard)
      }).then(function (board) {
        return t.getAsync('/1/boards/' + board.id + '/labels')
      }).filter(function (label) {
        if (label.name === labelName) {
          return label
        }
      }).then(function (label) {
        return Promise.map(list.cards, function (card) {
          return t.postAsync('1/cards/' + card.id + '/idLabels', {'value': label[0].id})
        }).then(function () {
          console.log('Done!')
        })
      })
    }).catch(function (err) {
      if (err) throw new Error('Could not label all cards', err)
    })
  }

  function createToday () {
    return Promise.try(function () {
      return init(options.trelloBoard)
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
        return moveCardPosition({
          targetList: result.targetList,
          dailyLabel: dailyLabel,
          dailyOnly: true,
          pos: 'top'
        })
      }).then(function () {
        return removeDuplicates()
      }).then(function () {
        console.log('Done')
      })
    }).catch(function (err) {
      console.log('Error in createToday', err)
    })
  }

  function createCard (cardText, list) {
    return Promise.try(function () {
      return init(options.trelloBoard, list)
    }).then(function (result) {
      return t.postAsync('/1/cards', {
        name: cardText,
        pos: 'top',
        due: null,
        idList: result.targetList,
        urlSource: null
      })
    }).then(function () {
      console.log('Created card:', cardText)
    }).catch(function (err) {
      console.log('Error creating card', err)
    })
  }

  function removeDuplicates (listId, dailyOnly) {
    return Promise.try(function () {
      return init(options.trelloBoard)
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
    }).catch(function (err) {
      console.log('Error removing duplicates', err)
    })
  }

  return {
    getLists: getLists,
    labelCards: labelCards, 
    listCards: listCards,
    createCard: createCard,
    createToday: createToday,
    removeDuplicates: removeDuplicates
  }
}
