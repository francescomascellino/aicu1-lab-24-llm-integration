# Local data directory

This directory is used by the local SQLite database.

When the app starts, it creates:

```txt
tickets.sqlite
```

Do not upload generated SQLite files to GitHub.

Keep this directory in the repository so the app has a clear place for local data.

L24 also stores explicitly confirmed incident drafts in this database. Generated
previews remain in memory and disappear when discarded or when the server stops.
