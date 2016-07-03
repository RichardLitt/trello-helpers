'use strict'

var Trello = require('node-trello')
var Promise = require('bluebird')
var moment = require('moment')
var _ = require('lodash')

module.exports = function initializeModule (options) {
  var t = Promise.promisifyAll(new Trello(options.trelloKey, options.trelloToken))
  var mainBoard
  var dailyLabel

  function init (boardName) {
    return Promise.try(function () {
      return findBoard(boardName || options.trelloBoard)
    }).then(function (board) {
      mainBoard = board

      return Promise.resolve(getLabelId(options.trelloLabel)).then((label) => {
        dailyLabel = label
        return mainBoard
      })
    }).catch(function (err) {
      console.log('Error initiating', err)
    })
  }

  function getLabelId (labelName) {
    return Promise.try(() => mainBoard || init())
    .then((board) => t.getAsync('/1/boards/' + board.id + '/labels/'))
    .then((labels) => _.find(labels, {name: labelName}))
    .then((label) => label.id)
    .catch((err) => {
      if (err) throw new Error(`Unable to get  label`)
    })
  }

  function findBoard (boardName) {
    return Promise.try(function () {
      return t.getAsync('/1/members/me')
    }).then(function (data) {
      return data.idBoards
    }).map(function (id) {
      return t.getAsync('/1/boards/' + id, {lists: 'all'})
    }).filter(function (board) {
      if (boardName === undefined) {
        console.log({'id': board.id, 'name': board.name})
      } else {
        return board.name === boardName
      }
    }).then(function (boards) {
      if (boardName === undefined) {
        throw new Error('boardName not set in ENV. Use one of the above IDs.')
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
    return Promise.resolve().then(function () {
      return t.getAsync('/1/lists/' + opts.targetList, {cards: 'open'})
    }).then(function (result) {
      return _.sortBy(result.cards, 'desc')
    }).filter(function (card) {
      return (opts.dailyOnly && _.includes(card.idLabels, dailyLabel))
    }).then(function (cards) {
      return cards.reduce(function (prev, card) {
        return prev.then(function () {
          return t.putAsync('/1/cards/' + card.id, {pos: card.desc || opts.pos})
        })
      }, Promise.resolve())
    }).catch(function (err) {
      console.log('Error in moveCardPosition', err)
    })
  }

  function checkDefaultLists (listName, processListName) {
    return Promise.try(function () {
      return mainBoard || init()
    }).then(function (board) {
      return Promise.all([
        getOrCreateList(board, listName || options.todayList),
        getOrCreateList(board, processListName || 'Daily Processes')
      ]).spread(function (targetList, sourceList) {
        return {
          boardId: board.id,
          targetList: targetList.id,
          sourceList: sourceList.id
        }
      })
    })
  }

  function getOpenLists () {
    return Promise.try(function () {
      return mainBoard || init()
    }).then(function (board) {
      return t.getAsync('/1/boards/' + board.id + '/lists/open')
    }).catch(function (err) {
      if (err) throw new Error('Unable to get lists')
    })
  }

  function archiveEmptyLists () {
    return Promise.try(function () {
      return mainBoard || init()
    }).then(function (board) {
      return t.getAsync('/1/boards/' + board.id + '/lists?cards=open')
    }).filter(function (list) {
      return _.isEmpty(list.cards)
    }).then(function (lists) {
      lists = _.groupBy(lists, 'name')
      for (var name in lists) {
        if (lists.hasOwnProperty(name)) {
          _.each(lists[name], function (list, key) {
            if (key !== 0) {
              t.putAsync('/1/lists/' + list.id + '/closed?value=true')
            }
          })
        }
      }
    })
  }

  /* Print all open list names from the default board */
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
      return Promise.map(list.cards, function (card) {
        if (card.closed === false) {
          console.log(card.name)
        }
      })
    }).catch(function (err) {
      if (err) throw new Error('Could not find list')
    })
  }

  function createToday () {
    return Promise.try(function () {
      return mainBoard || init()
    }).then(function (board) {
      return checkDefaultLists(options.todayList)
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
        return removeDuplicates(options.todayList)
      }).then(function () {
        return archiveEmptyLists()
      }).then(function () {
        console.log('Done')
      })
    }).catch(function (err) {
      console.log('Error in createToday', err)
    })
  }

  function createCard (cardText, list, position) {
    return Promise.try(function () {
      return mainBoard || init()
    }).then(function (board) {
      return checkDefaultLists(list)
    }).then(function (result) {
      return t.postAsync('/1/cards', {
        name: cardText,
        pos: position || 'top',
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

  function removeDuplicates (listName, args) {
    return Promise.try(function () {
      return mainBoard || init()
    }).then(function (board) {
      return checkDefaultLists(listName || options.todayList)
    }).then(function (result) {
      if (listName == null) {
        return result.targetList
      } else {
        return Promise.try(function () {
          return getOpenLists()
        }).filter(function (result) {
          return listName === result.name
        }).then(function (result) {
          return result[0].id
        }).catch(function (err) {
          console.log('Unable to find ' + listName, err)
        })
      }
    }).then(function (result) {
      return Promise.try(function () {
        return t.getAsync('/1/lists/' + result, {cards: 'open'})
      }).then(function (result) {
        return _.difference(result.cards, _.uniq(result.cards, 'name'))
      }).filter(function (card) {
        if (args && args.label) {
          return Promise.resolve(getLabelId(args.label)).then((labelId) => {
            return (_.includes(card.idLabels, labelId))
          })
        } else {
          return (_.includes(card.idLabels, dailyLabel))
        }
      }).map(function (card) {
        return Promise.try(function () {
          return t.delAsync('/1/cards/' + card.id)
        }).then(function () {
          // console.log('Deleted card: ' + card.name + ' (' + card.id + ')')
        })
      }).then(function (result) {
        // console.log('Done deleting duplicates.')
      })
    }).catch(function (err) {
      console.log('Error removing duplicates', err)
    })
  }

  return {
    findBoard: findBoard,
    getLists: getLists,
    archive: archiveEmptyLists,
    listCards: listCards,
    createCard: createCard,
    createToday: createToday,
    removeDuplicates: removeDuplicates
  }
}
