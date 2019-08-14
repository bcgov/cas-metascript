Metascript
[![CircleCI](https://circleci.com/gh/bcgov/cas-metascript.svg?style=shield)](https://circleci.com/gh/bcgov/cas-metascript)
======

# Metabase Question & Dashboard automation script
Metascript is a tool that helps to keep questions and dashboards on metabase from breaking on an update to the underlying data structure.

## Dependencies
- commander
- dotenv
- mkdirp
- node-fetch
- node-sql-parser
- request

## Usage
- See the .env.example for how to set up the environment for your Metabase instance.

### Pull from Metabase
`metascript pull [options]`
Options:
- ('-D, --debug', 'show options')
- ('-i, --database-id <id>', 'Metabase database id')
- ('-q, --question-destination <destination>', 'pull questions to a destination folder')
- ('-d, --dashboard-destination <destination>', 'pull dashboards to a destination folder')
- ('-l, --entity-list <list>', 'pull a set of questions / dashboards (default: [] pulls/pushes all)', [])
- ('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')
** On a failed broken question check, without ignore the script exits with code 1

### Push to Metabase
`metascript push [options]`
Options:
- ('-D, --debug', 'show options')
- ('-i, --database-id <id>', 'Metabase database id')
- ('-q, --question-directory <dir>', 'push questions to metabase from directory')
- ('-d, --dashboard-directory <dir>', 'push dashboards to metabase from directory')
- ('-l, --entity-list <list>', 'push a set of questions / dashboards (default: [] pushes all)', [])
- ('-s, --save', 'save new instances of the entities to metabase (new metabase IDs)')
- ('-e, --edit', 'save edited instances of the entities in place (keep current metabase IDs)')
- ('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')

### Get broken questions
`metascript get-broken-questions [options]`
Options:
- ('-i, --database-id <id>', 'Metabase database id')
** Get broken questions is part of pull / push commands, but it can also be run separately