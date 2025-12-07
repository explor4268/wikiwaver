# wikiwaver

[GitHub](https://github.com/explor4268/wikiwaver) | [Codeberg mirror](https://codeberg.org/exploraz/wikiwaver)

Listen to Wikipedia's Recent Changes feed using the [official EventStreams HTTP Service provided by Wikimedia Foundation](https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams_HTTP_Service).

This project was originally started as a clone of <https://github.com/hatnote/listen-to-wikipedia>, which uses WebSockets instead of EventStreams and has no HTTPS support yet.

> [!WARNING]
> **FOR CELLULAR DATA/METERED/SLOW INTERNET USERS**
> 
> Beware that because of the EventStreams approach and the [lack of event filtering](https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams_HTTP_Service#Filtering), this web app uses a significant amount of network bandwidth (about 60-100 KiB/s or about 500-800 kbit/s) compared to the Web Sockets approach, which is what `hatnote/listen-to-wikipedia` is using instead.
> 
> Running this web app in the foreground or background for an hour could consume roughly **up to 350 megabytes of data, or even more.** So, ensure that you have a sufficient internet connection before running this web app in the background.

## Features

**Audio:**

- Web Audio (Synth)
- MIDI

**Wikipedia Recent Changes:**

- Notify on edits
- Notify on reverts
- Notify on new pages
- Notify on page deletions
- Notify on page moves
- Notify on new users

## TODO

- [ ] Sampled Instruments for Audio
- [ ] More options
  - [ ] url params
    - [ ] disable seedrandom
    - [ ] disable localstorage
    - [ ] disable autolisten

## Credits

See [CREDITS.md](./CREDITS.md)

## License

[MIT License](./LICENSE)
