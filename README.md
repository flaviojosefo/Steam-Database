# **Steam Database**

## Author

- **[Flávio Santos](https://github.com/fs000) - a21702344**

## Summary

This project uses Node.JS, MongoDB, Express, Passport and Google's OAuth 2.0 to
recreate a website scenario where *games* can be added to a database, displayed
on a *store* page and later added to individual user libraries.

Extra information about games is acquired through JSON files provided by
[Steam's Web API](https://developer.valvesoftware.com/wiki/Steam_Web_API#JSON).

## Discussion

### Base Code

The project was initiated through the use of
[auth-google-passport](https://github.com/jrogado/auth-google-passport)'s code
provided by our teacher [José Rogado](https://github.com/jrogado).
It contained all the necessary steps to allow user login through Google's API and
offered a nice web layout to start upon.

This base code gave insight on how to initialize server based functions through
`app.js`, how to redirect the user through different web pages with the help of
`authRoutes.js`, how to register a user in a database (and save his information
in a session) in `passport.js` after accessing Google's OAuth API, how to
initialize a server with or without `https` (through the use of a `.env` variable
that controls the application's environment) and the use of certificates and
private keys and, finally, how to make use of a middleware to force user login
if a specific route requires it (found on `middleware.js`).

One important note is that web pages are built through the use of a template engine
named *Embedded JavaScript Templating* (or `ejs`). As the name suggests, these
types of files allow `html` generation through the use of embedded *JavaScript*,
meaning we can pass code directly to `html` and build upon it with the help of
specific tags such as `<%>`. We can also display variable values with the `<%=>` tag.

### Project Files

Through the project's creation, a couple of files were of utmost importance, namely:
`gameRoutes.js`, all `.js` files present on the `models` directory and all `.ejs`
files added to the project (found on `views` folder) in order to render web pages.

Starting with `models`, `3` files can be found inside: `User.js`, `Game.js` and
`Library.js`. These files contain Mongoose `Schemas` in order to save specific
information on MongoDB on `collections` specified in each file.

1. The first one represents the a `User`, which includes pertinent information
about a user to be saved on the database, with the most important variable being
its `googleId`.

2. The second one represents (as the name implies) a `Game`'s structure. This
includes a `title`, `steamId`, `genres` array, `developer` and information about
who added the game to the database and when. Server-side, `steamId` lets us fetch
extra information about a game by looking it up on Steam's API.

3. The third one represents a user's `Library`, and contains only the user's
`googleId` and the `steamId` of any game owned by the user in question as an
`array` (the date at which the game was added is also saved). This makes it so
that if a user or game is ever to be destroyed on their specific `collections`,
values which represent them are still present on a `libraries` collection.

On `views`, some original files were tweaked, while others were created from scratch.
These (other) files are: `add_game.ejs`, `store.ejs`, `display_game.ejs` and `library.ejs`.

1. The first file is responsible for rendering a web page in which **any user**
has the ability to add a `Game` to the database. In order to do this, a `form`
is present on the page, which reads the user's input and validates it when
attempting to submit (more on this further below).

2. The second file displays a `Store` page, in which **any user** can visualize
all games present on the database. Each of these games is represented by a `logo`,
its `steamId`, `title` and `genres`. There is also a `button` present, which adds
a game to the user's library (more on this below). Some elements possess a
`hyperlink` redirecting to a game's page. If the given `steamId` is invalid, the
fetched `logo` is the one present on the *local* `images` folder (`applogo.svg`).

3. The third file renders specific information about a given game. This not only
displays database info, but also extra details if the `steamId` is valid.

4. The fourth and final file is responsible for displaying a user's library.
Here, a user can see what games have been added to its library (if the user
possesses none, a message about that fact is displayed instead). Users can also
`remove` games on this page (effectivelly removing them from their library on MongoDB).

The `gameRoutes.js` file is the most important file in the whole project,
essentially controlling the flow (routing) of the program's main responsibilities.

In here, express' `Router()` is put to work, by essentially building upon two
important functions for each `route`: `GET` and `POST`.\
Let's analyze the `GET` one's first:

- `/add` - Render the `add_game` page.

- `/store` - Fetch all games found on the database and reverse their order (to
show the most recently added ones first); Fetch an external logo by each game's
`steamId` (`fetchLogo(appId)`); If the user is `authenticated`, check which games
are already owned in order to disable correspondant `Add Game` buttons; Display
this information on the `store` page.

- `/store/:id` - Fetch information about a specific game from `MongoDB` and `Steam`;
If the user is `authenticated`, verify if the game is already owned, disabling the
`Add Game` button if `true`; If the `steamId` is non existent on the `Steam Web API`
send no information to the `ejs` file; Finally, render the page.

- `/library` - Force user login through `isAuth` middleware; Fetch a user's
`library` by its `googleId`; Create one if it doesn't exist; Verify if a `steamId`
was sent in a `query` (which means a game is to be added to the library), and if
`true`, check if the game is already present on the user's library; Add the game
if not present; Redirect the user back to the library **without the query**;
Fetch a user's library once again (updated) and reverse the games' order so the
page displays them by *most recent*; Fetch owned games from database and `sort`
them to match the user's library order; Finally, display the page, with each game
showcasing a `logo`, title and date at which it was added to the `library`.

As we can see, the ambiguity of user login in specific pages makes it so that each
`GET` requires added `find` functions, but it does behave like a normal storefront
(any user can see the products, but not acquire them without an account).

Now for the `POST` ones:

- `/add` - Check if game with specific `steamId` already exists; If `true`, re-render
the `add_game` page with a `warning` to the user; If not, create a `new Game` and
send the information from the `form` (`req.body`) to `MongoDB`; If the user is **not**
`authenticated`, the alias will be `Unknown`; At last, redirect the user to the `store`.

- `/library` - Remove a specified game from the user's library, by `pulling` it,
using the user's `googleId` and the game's `steamId` to know which game to remove;
Lastly, redirect back to the library.

Now that we know what's behind the program, we can sum functionality into 4 points:

- **Any** user has access to the store and specific game pages.
- **Any** user has the ability to add games to the database.
- Only **logged** users have access to their respective libraries.
- Only **logged** users can add games to their libraries.

## Conclusions

This project was a challenging one. I had already worked with these types of
technologies, just not on a level where I understood too much of what I was doing.
However, now, a year later, I can confidently say that I have a complete grasp on
everything that was built.

By taking some freedom with the objective of the project and selecting something
that was a little bit of an extra compared to what was required, I was able to
learn a lot, not only about semantics or JS structure, but also about how to
effectively build an application with which users can interact in a direct manner
(through Google's API) and save important interaction results in a database (user
info, games, etc. on MongoDB).

This project helped me realize that building client-server applications is not
as hard as it seems. There are a lot of APIs and libraries which aid us in a
multitude of functions that we require to get projects going, by hiding a lot
of the more hard to understand concepts.\
I believe my work speaks for itself as I really enjoyed learning all the
elements on which my application runs.

## Thanks

I'd like to thank our teacher [José Rogado](https://github.com/jrogado) for all
his valuable input throughout the making of this project (and the whole semester!),
aswell as for providing the base code.
