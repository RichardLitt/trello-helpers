#!/usr/bin/env node
'use strict'
require('epipebomb')()

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    c: 'create',
    d: 'duplicates',
    l: 'list',
    t: 'today',
    p: 'position'
  }
})

var trelloHelperLib = require('../lib')({
  trelloKey: process.env.TRELLO_KEY,
  trelloToken: process.env.TRELLO_TOKEN,
  trelloBoard: process.env.TRELLO_BOARD,
  todayList: process.env.TRELLO_LIST || 'Today', // This is what you call your main To Do list. See Readme.
  trelloLabel: process.env.TRELLO_LABEL || 'Daily' // This is what you replicate each time you run 'today'. See Readme.
})

if (argv._.indexOf('today') !== -1) {
  trelloHelperLib.createToday()
} else if (argv._.indexOf('duplicates') !== -1) {
  trelloHelperLib.removeDuplicates(argv['list'])
} else if (argv['create']) {
  trelloHelperLib.createCard(argv['create'], argv['list'] || 'In', argv['position'] || 'bottom')
} else if (argv._.indexOf('lists') !== -1) {
  trelloHelperLib.getLists()
} else if (argv['list']) {
  trelloHelperLib.listCards(argv['list'])
} else if (argv['archive']) {
  trelloHelperLib.archive()
} else {
  console.log('No argument supplied.')
  process.exit(1)
}
