# Twitter Idle AutoRefresh

A Mozilla Firefox add-on that automatically reveals unread tweets every set seconds on Twitter feeds, so long as the customisable conditions are met. The primary goal of this add-on is to allow you to continiously read Twitter whilst doing other things on the side (e.g. work).

You may find a handful of options (including but not limited to the customisable conditions for the auto-refreshing procedure) through the Mozilla Firefox add-on's page (`about:addons`).

PS. The add-on will only work with the new Twitter design, as per July 2019.
PSS. Should you change the Twitter design in their Display settings, it is recommended that you refresh the page to re-initialise the add-on.

> Please read!
>
> As a privacy proponent myself, I would like to briefly state that this add-on will **NEVER** record any data whatsoever (e.g. browsing habits). It does however require the `storage` permission in order to save &amp; read its user settings. It will also only activate on URLs matching `*://twitter.com/*`.
>
> The add-on is freely available on [GitHub](https://github.com/anomalyce/twitter-idle-autorefresh) for full transparency.

---

### Local Changes
Should the add-on stop working as a result of a breaking change from Twitter's end and I haven't gotten around to fixing it yet, or you just want to improve upon the existing feature set, you can tell Firefox to use your local version of this repository by doing the following:

```bash
git clone https://github.com/anomalyce/twitter-idle-autorefresh.git
```

Open your Firefox instance, navigate to `about:debugging` and click on the **This Firefox** tab in the sidebar. At the top of all your listed add-ons, there's a button **Load Temporary Add-on...**. Click on it and select the `manifest.json` file within the git repository from the command above.

Firefox will now load your local instance of the add-on over the one from the [AMO](https://addons.mozilla.org/en-US/firefox/addon/twitter-idle-autorefresh/).

You may now go ahead and make whatever changes you want. If your changes aren't taking effect, go back to the `about:debugging` page, find your local add-on and click on the **Reload** button.
