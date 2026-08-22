# wikiwaver

[GitHub](https://github.com/explor4268/wikiwaver) | [Codeberg mirror](https://codeberg.org/exploraz/wikiwaver)

Listen to Wikipedia's Recent Changes feed using the [official EventStreams HTTP Service provided by Wikimedia Foundation](https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams_HTTP_Service).

This project was originally started as a clone of <https://github.com/hatnote/listen-to-wikipedia>, which uses WebSockets instead of EventStreams, and was lacking support for HTTPS.

> [!WARNING]
> **FOR CELLULAR DATA/METERED/SLOW INTERNET USERS**
> 
> Beware that because of the EventStreams approach and the [lack of event filtering](https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams_HTTP_Service#Filtering), this web app uses a significant amount of network bandwidth (about 60-100 KiB/s or about 500-800 kbit/s) compared to the Web Sockets approach, which is what `hatnote/listen-to-wikipedia` is using instead.
> 
> Running this web app in the foreground or background for an hour could consume roughly **up to 350 megabytes of data, or even more.** So, ensure that you have a sufficient internet connection before running this web app in the background.

## Features

**Audio:**

- Web Audio (Synth)
- Web Audio (Samples)
- MIDI with WEBMIDI.js library (loaded from `cdn.jsdelivr.net`)

**Wikipedia Recent Changes:**

- Notify on edits
- Notify on reverts
- Notify on new pages
- Notify on page deletions
- Notify on page moves
- Notify on new users

## Preferences

Most options in the UI will be saved into your browser's per-site local storage.

### URL search parameter-only preferences

The following preferences can only be set using the page URL search parameters. For example, adding `?autoListen=0` into the end of the page URL will set `autoListen` to `0`, and using `?enableNetworkWarnings=0&useSeedrandom=0` will set `enableNetworkWarnings` to `0` and `useSeedrandom` to `0`

#### `enableNetworkWarnings`

Enables the initial warning message at page load. Default is enabled (equivalent to setting the value as anything other than `0`).

Setting this parameter into `0` will suppress the warning prompt, but setting it into any other values including `1` will not re-enable the prompt if the "Don't show this message again" option is selected.

#### `useSeedrandom`

Enables the usage of the `seedrandom` library. Default is enabled (equivalent to setting the value as anything other than `0`).

Setting this parameter into `0` will disable both the loading and usage of the `seedrandom` library. Library is loaded from `cdnjs.cloudflare.com` if enabled.

#### `clearPrefs`

Clears any saved preferences in your browser's local storage. Default is disabled (equivalent to setting the value as anything other than `1`).

This only affects keys prefixed with `wikiwaver:` on the same host as the page, meaning that other preferences for my other projects will not be cleared.

Setting this parameter into `1` will clear saved preferences on every page load as long as this parameter is set to `1`.

#### `useLocalStorage`

Enables the usage of the browser's local storage API. Default is enabled (equivalent to setting the value as anything other than `0`).

Setting this parameter into `0` will prevent any preferences to load from or save into your browser's local storage, without clearing your saved preferences.

#### `autoListen`

Enables the automatic connection and listening into Wikimedia's EventStreams Service. Default is enabled (equivalent to setting the value as anything other than `0`).

Automatic audio playback is not possible because of autoplay limitation in most browsers.

Setting this parameter into `0` will disable the automatic connection to Wikimedia's EventStreams Service.

## Credits

See [CREDITS.md](./CREDITS.md)

## License

[MIT License](./LICENSE)
