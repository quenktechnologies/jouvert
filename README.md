# Jouvert

J'ouvert is a toolkit for client side development maintained and 
used by [Quenk Technologies](https://quenk.com).

This toolkit is influenced by the actor model and message passing and uses
the [potoo](https://github.com/quenktechnologies/potoo) framework to establish
an actor system.

## Installation

```sh
npm install --save-dev @quenk/jouvert
```

## Contents

J'ouvert ships with three main modules:

1. actor   - Contains interfaces that describe behaviours common to 
             single page applications as actors. Also provides concrete
             actor implementations of common browser apis.

2. app     - Contains opinionated use case specific modules usually
             based on an application that has been built before.

3. browser - Contains interfaces and classes for browser interaction
             independant of actors.

## Getting Started

A J'ouvert app can be seen as an actor system where various features users
interact with are implemented via one or more actors. As much as possible,
message passing should be used so apps are easier to extend in the future.

Note: J'ouvert is not recommended for simple low feature apps.

The main entry point for any J'ouvert app is the `actor#JApp` class.
Extend this class to implement your application's actor system and spawn
actors for the application's various views in it run method.

The `actor/api` module provides routers and http resource actors that
can be used for dynamically changing views and fetching data respectively.

See the relevant documentation on how to.

## Contact

If you would like to use J'ouvert in an application or need help,
please reach out to `info @ quenk com`.

## License

Apache-2.0 (c) Quenk Technologies Ltd 2019
