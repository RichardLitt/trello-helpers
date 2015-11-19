#!/usr/bin/env node
'use strict'

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    c: 'create',
    d: 'duplicates',
    l: 'list',
    t: 'today'
  }
})

var trelloHelperLib = require('../lib')({
  trelloKey: process.env.TRELLO_KEY,
  trelloToken: process.env.TRELLO_TOKEN,
  trelloBoard: process.env.TRELLO_BOARD,
  trelloLabel: process.env.TRELLO_LABEL
})

if (argv._.indexOf('today') !== -1) {
  trelloHelperLib.createToday()
} else if (argv._.indexOf('duplicates') !== -1) {
  trelloHelperLib.removeDuplicates()
} else if (argv['create']) {
  trelloHelperLib.createCard(argv['create'], argv['list'] || undefined)
} else if (argv._.indexOf('lists') !== -1) {
  trelloHelperLib.getLists()
} else if (!argv['create'] && argv['list'] && argv['label']) {
  trelloHelperLib.labelCards(argv['list'], argv['label'])
} else if (!argv['create'] && argv['list']) {
  trelloHelperLib.listCards(argv['list'])
} else {
  console.log('No argument supplied.')
  process.exit(1)
}
