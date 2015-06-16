# trello-helpers

This integrates with your Trello account using the API to do some more complicated repetitive operations.

## Methods

#### today

`$ trello-helpers today`

Aliases: `today`, `t`

This will copy all of the cards from a list (mine is called 'Daily Processes') to another list with the format `June 16th, 2015`. It then copies all of those cards from that list to a list called `Today`, the goal being that daily processes are added to your to do list for that day, and you have a fresh card to start putting daily accomplishments on. 

#### duplicates

`# trello-helpers duplicates`

Aliases: `duplicates`, `dupes`, `dedupe`, `d`

This will delete duplicate cards in a given list. It will also selectively delete only cards which have a certain label (mine is `daily`). 
