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
  todayList: process.env.TRELLO_LIST,
  trelloLabel: process.env.TRELLO_LABEL
}
```

Your key and token can be gotten from the Trello API, [here](https://trello.com/app-key).

Other values:  
  - `TRELLO_BOARD`: This should be the name for your default Board.  
  - `TRELLO_LIST`: This should be the name for your active To Do list, often called _Today_ or _To Do_.  
  - `TRELLO_LABEL`: This should be the id for a Trello Label you to identify daily lists. See [issue #12](https://github.com/RichardLitt/trello-helpers/issues/12).

## Methods

#### create

`$ trello-helpers --create 'This is a new card'`

This will create a new card at the top of your target list as specified in your env, with the name of the argument.  

Aliases: `c`  
Options: 
  - `-list <target list>`  
    Description: An optional `list` argument will create the card if a list exists with that name.  
    Aliases: `l`  
    Default: `In`  
  - `-position <position>`  
    Description: An optional `position` argument will specify where that card should go in the list.  
    Aliases: `p`  
    Values: `top`, `bottom`, or positive number.  
    Default: `top`  

#### duplicates

`$ trello-helpers duplicates`

This will delete duplicate cards in a given list. It will also selectively delete only cards which have a certain label (mine is `daily`).  

Aliases: `d`  
Options:  
  - `-list <target list>`
    Description: This will delete duplicates in a given list if a list exists with that name.
    Aliases: `l`
    Default: `process.env.TRELLO_LIST`

#### lists

`$ trello-helpers lists`

This will console log the names of all lists for the given board.

#### list <list_name>

`$ trello-helpers --list 'To Do'`

This will print the names of all cards for a given list.

Aliases: `l`

#### today

`$ trello-helpers today`

This will copy all of the cards from a list (mine is called 'Daily Processes') to another list with the format `June 16th, 2015`. It then copies all of those cards from that list to a list called `Today`, the goal being that daily processes are added to your to do list for that day, and you have a fresh card to start putting daily accomplishments on.

Aliases: `t`

#### archive

`$ trello-helpers --archive`

This will archive any duplicate empty lists, because who needs those, amiright?

