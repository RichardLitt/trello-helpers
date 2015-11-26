# trello-helpers

This integrates with your Trello account using the API to do some more complicated repetitive operations.

<a href="https://nodei.co/npm/trello-helpers/"><img src="https://nodei.co/npm/trello-helpers.png?downloads=true&downloadRank=true&stars=true"></a>

## Installation

Global:
`npm i -g trello-helpers`

Environmental Variables:

```js
{
  trelloKey: process.env.TRELLO_KEY,
  trelloToken: process.env.TRELLO_TOKEN,
  trelloBoard: process.env.TRELLO_BOARD,
  trelloLabel: process.env.TRELLO_LABEL
}
```

Your key and token can be gotten from the Trello API. Your board should be in the URL of the board you want. The label is used for daily lists, and needs to be gotten programmatically.

## Methods

#### create

`$ trello-helpers --create 'This is a new card'`

Aliases: `c`
Options: `-l <target list>`

This will create a new card at the top of your target list as specified in your env, with the name of the argument.

An optional `list` argument will create the card if a list exists with that name.

#### duplicates

`$ trello-helpers duplicates`

Aliases: `d`

This will delete duplicate cards in a given list. It will also selectively delete only cards which have a certain label (mine is `daily`).

#### lists

`$ trello-helpers lists`

This will console log the names of all lists for the given board.

#### list <list_name>

`$ trello-helpers --list 'To Do'`

Aliases: `l`

This will print the names of all cards for a given list.

#### today

`$ trello-helpers today`

Aliases: `t`

This will copy all of the cards from a list (mine is called 'Daily Processes') to another list with the format `June 16th, 2015`. It then copies all of those cards from that list to a list called `Today`, the goal being that daily processes are added to your to do list for that day, and you have a fresh card to start putting daily accomplishments on.
