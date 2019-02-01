---
templateKey: blog-post
title: "Google CloudSQL is a defective product" 
date: 2019-02-01T18:54:13.868Z
description: If you are using Google CloudSQL backups without exporting, you are one click away from disaster.
tags:
  - DevOps
  - CloudSQL
---

Questions? Comments? Twitter discussion here: https://twitter.com/h0nkyc41/status/1090751831133679616

If you are using Google CloudSQL, you are one command away from losing everything:

```
gcloud sql instances delete prod-instance-name
```

When you delete a CloudSQL instance, it also deletes the back-ups associated with that instance along with it. So if you accidentally delete your production database: Your backups? Poof. Gone.

It says this in the fine print of the [on-demand backups documentation](https://cloud.google.com/sql/docs/mysql/backup-recovery/backups#about_on-demand_backups):

```
They persist until you delete them or until their instance is deleted.
```

There is also no way to mark a CloudSQL instance as "protected" so one bad CLI command can lose you your production database and all backups.

In order to get an actual backup workflow that will not affect production traffic, you must:

- Clone your production SQL instance
- Wait for the clone to complete
- Run export on the production clone instance
- Delete the production clone instance


For me, Google CloudSQL does not do enough to protect my production data from accidental deletion. I would argue it is unclear how your production backups are being handled. I would argue their product treats your production data and backups irresponsibly.

Don't fall for it. Protect your production data. Avoid busywork caused by poor product design. Avoid Google CloudSQL.
