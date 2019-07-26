document.addEventListener('DOMContentLoaded', () => {
    function fallback(value, fallback) {
        return value !== undefined && value !== null ? value : fallback
    }

    let settings = browser.storage.sync.get(null)

    settings.then((options) => {
        // Settings
        document.querySelector('#setting-updatefrequency').value = fallback(options.settingUpdatefrequency, 15)

        // Indicate add-on state by...
        document.querySelector('#indicate-by-logo').checked = fallback(options.indicateByLogo, true)

        // Pause the add-on on...
        document.querySelector('#pause-on-focus').checked = fallback(options.pauseOnFocus, true)
        document.querySelector('#pause-on-feedscrolled').checked = fallback(options.pauseOnFeedscrolled, true)
        document.querySelector('#pause-on-popups').checked = fallback(options.pauseOnPopups, true)
        document.querySelector('#pause-on-inputfocus').checked = fallback(options.pauseOnInputfocus, true)
        document.querySelector('#pause-on-homefeed').checked = fallback(options.pauseOnHomefeed, false)
        document.querySelector('#pause-on-profilefeeds').checked = fallback(options.pauseOnProfilefeeds, false)
    }, (error) => {
        // Handle errors...
    })
})

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault()
    
    browser.storage.sync.set({
        // Settings
        settingUpdatefrequency: document.querySelector('#setting-updatefrequency').value,

        // Indicate add-on state by...
        indicateByLogo: document.querySelector('#indicate-by-logo').checked,

        // Pause the add-on on...
        pauseOnFocus: document.querySelector('#pause-on-focus').checked,
        pauseOnFeedscrolled: document.querySelector('#pause-on-feedscrolled').checked,
        pauseOnPopups: document.querySelector('#pause-on-popups').checked,
        pauseOnInputfocus: document.querySelector('#pause-on-inputfocus').checked,
        pauseOnHomefeed: document.querySelector('#pause-on-homefeed').checked,
        pauseOnProfilefeeds: document.querySelector('#pause-on-profilefeeds').checked,
    })
})
