#!/usr/bin/env node
'use strict'

var argv = require('minimist')(process.argv.slice(2))
var _ = require('lodash')

var trelloHelperLib = require('../lib')({
  trelloKey: process.env.TRELLO_KEY,
  trelloToken: process.env.TRELLO_TOKEN,
  trelloBoard: process.env.TRELLO_BOARD,
  trelloLabel: process.env.TRELLO_LABEL
})

if (_.intersection(['today', 't'], argv._).length !== 0) {
  trelloHelperLib.createToday()
} else if (_.intersection(['duplicates', 'd', 'dupes', 'dedupe'], argv._).length !== 0) {
  trelloHelperLib.removeDuplicates()
} else if (argv['create'] || argv['c']) {
  trelloHelperLib.createCard(argv['create'] || argv['c'])
} else {
  console.log('No argument supplied.')
  process.exit(1)
}
