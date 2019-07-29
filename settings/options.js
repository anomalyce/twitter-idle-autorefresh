document.addEventListener('DOMContentLoaded', () => {
    function fallback(value, fallback) {
        return value !== undefined && value !== null ? value : fallback
    }

    let settings = browser.storage.sync.get(null)

    settings.then((options) => {
        document.querySelector('#setting-updatefrequency').value = fallback(options.settingUpdatefrequency, 15)
        document.querySelector('#setting-logoindicator').checked = fallback(options.settingLogoIndicator, true)
        document.querySelector('#setting-debuglogs').checked = fallback(options.settingDebugLogs, false)

        document.querySelector('#refresh-channel-home').checked = fallback(options.refreshChannelHome, true)
        document.querySelector('#refresh-channel-profile').checked = fallback(options.refreshChannelProfile, false)
        document.querySelector('#refresh-channel-search').checked = fallback(options.refreshChannelSearch, false)
        document.querySelector('#refresh-condition-focus').value = fallback(options.refreshConditionFocus, 'unfocused')
        document.querySelector('#refresh-condition-scrollbar').value = fallback(options.refreshConditionScrollbar, 'top')
        document.querySelector('#refresh-user-mousemovement').checked = fallback(options.refreshConditionMouseMovement, true)
    }, (error) => {
        // Handle errors...
    })
})

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault()
    
    browser.storage.sync.set({
        settingUpdatefrequency: document.querySelector('#setting-updatefrequency').value,
        settingLogoIndicator: document.querySelector('#setting-logoindicator').checked,
        settingDebugLogs: document.querySelector('#setting-debuglogs').checked,

        refreshChannelHome: document.querySelector('#refresh-channel-home').checked,
        refreshChannelProfile: document.querySelector('#refresh-channel-profile').checked,
        refreshChannelSearch: document.querySelector('#refresh-channel-search').checked,
        refreshConditionFocus: document.querySelector('#refresh-condition-focus').value,
        refreshConditionScrollbar: document.querySelector('#refresh-condition-scrollbar').value,
        refreshConditionMouseMovement: document.querySelector('#refresh-user-mousemovement').checked,
    })
})
