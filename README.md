# Vechain snapshot

The application supports indexing every token Transfer of the received token on the Vechain Mainnet, by calling *connex filter* method of Vechain service.

The indexing process receives to block number parameter, which allows on-demand indexing - *TokenService::syncTransfers*

The aggregation process, creates an aggregation of token holders into a separate table - *TokenService::aggregateTransfers*. Then processes transfers by, optionally, filtering transfers from and to a specific block and accumulating the balance change over this period of time. Running the initial aggregation, from the date of the token creation, will result an accurate balance for each holder.

The data is inserted into a cluster of MongoDB (permission certificate should be located in the *secrets* folder).

The application supports the following functionality:

* Syncing token Transfers - *TokenService::syncTransfers*

* Aggregating token Transfers - *TokenService::aggregateTransfers*

* Fetching token holder's balance - *TokenService::getHoldingForToken*

## Performance

The application should support millions of transfers, as the *Transfer* event sync is performed through pagination of X transfers and inserted directly into database as-is. Aggregation is used map-reduce paradigm, which supports the required volumes. If required the cluster can be increased to support more throughput.

Advanced indexes can be added on the collections, depending on retrieval habits - currently none.

Ideally, the application is connected to a messaging queue, which receives the sync and aggregate triggers through it.

### Improvements

Syncing doesn't support an advanced error handling, and failing to retrieve the block or page, will fail the whole process. This will result in out-of-sync database.

### Testing

All back-end services have unit tests for the major use-cases. During the tests, a local MongoDB cluster is automatically generated and used for the tests.

### Code structure

The project is structured using domain-driven design, with each part of the system residing in a separate folder. Tests reside next to the code.

### Technical Stack

Nodejs, MongoDB

### Supported scripts

There are several supported scripts inside *project.json*:

* build - to compile the project

* test - to run the tests

* lint - to check code for issues

* lint:fix - to automatically fix code issues
