(function() {
    class TwitterIdleAutoRefresh {
        get Manifest() { return browser.runtime.getManifest() }
        get FeedSelector() { return 'main [data-testid=primaryColumn] section[role=region]' }
        get RefreshSelector() { return 'h1[role=heading] a[role=button] > div:first-child' }
        get StatusSelector() { return 'h1[role=heading] [href="/home"] svg' }
        get DefaultOptions() {
            return {
                settingUpdatefrequency: 15,
                settingLogoIndicator: true,
                settingDebugLogs: false,

                refreshChannelHome: true,
                refreshChannelProfile: false,
                refreshChannelSearch: false,
                refreshConditionFocus: 'unfocused',
                refreshConditionScrollbar: 'top',
                refreshConditionMouseMovement: true,
            }
        }

        /**
         * Initialise the add-on.
         * 
         * @return void
         */
        constructor() {
            let addon = this

            this.pause()

            this.twitterHasLoaded()
                .then((data) => {
                    let settings = browser.storage.sync.get(null)

                    settings.then((options) => {
                        addon.options = addon.getOptions(options)

                        addon.createIndicator()
                        addon.log('Twitter has finished loading the initial feed.')

                        new TweetWatcher(addon)
                    }, (error) => {
                        addon.error('Unable to fetch add-on options.', true)
                    })
                })
                .catch((error) => {
                    console.log(error)
                })
        }

        /**
         * Wait for Twitter to properly load before starting the Tweet Watcher.
         *
         * @return \Promise
         */
        twitterHasLoaded() {
            let addon = this

            return new Promise((resolve, reject) => {
                let observer = new MutationObserver((mutations, observer) => {
                    mutations.forEach((mutation) => {
                        if (! mutation.addedNodes) {
                            return
                        }

                        for (let i = 0; i < mutation.addedNodes.length; i++) {
                            let node = mutation.addedNodes[i]

                            if (node.matches(addon.FeedSelector)) {
                                observer.disconnect()
                                return resolve({ feed: node })
                            }
                        }
                    })
                })

                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: false,
                    characterData: false,
                })
            })
        }

        /**
         * Pause the addon.
         *
         * @return void
         */
        pause() {
            this.paused = true
        }

        /**
         * Resume the addon.
         *
         * @return void
         */
        resume() {
            this.paused = false
        }

        /**
         * Check whether the addon is paused or not.
         *
         * @return boolean
         */
        isPaused() {
            return this.paused === true
        }

        /**
         */
        createIndicator() {
            this.twitterLogo = document.querySelector(this.StatusSelector).parentNode

            let indicator = this.twitterLogo.cloneNode('div')
            indicator.classList.add('twitter-idle-autorefresh-indicator')
            indicator.innerHTML = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M96.0008 18.2366C92.4675 19.8022 88.6763 20.864 84.6929 21.3381C88.7602 18.9025 91.8736 15.0392 93.3492 10.4501C89.534 12.7056 85.3227 14.3434 80.8355 15.2312C77.2422 11.398 72.1312 9.01038 66.4622 9.01038C55.5862 9.01038 46.7679 17.8287 46.7679 28.6987C46.7679 30.2403 46.9418 31.7461 47.2778 33.1859C30.913 32.364 16.4018 24.5235 6.6896 12.6096C4.99188 15.5131 4.02607 18.8963 4.02607 22.5078C4.02607 29.3406 7.50545 35.3694 12.7845 38.8967C9.55706 38.7887 6.5216 37.9009 3.86419 36.4251V36.6711C3.86419 46.2093 10.6549 54.1698 19.6592 55.9815C18.0094 56.4254 16.2698 56.6714 14.4702 56.6714C13.1985 56.6714 11.9687 56.5454 10.7629 56.3054C13.2703 64.134 20.5411 69.8269 29.1555 69.9829C22.4187 75.262 13.9243 78.3994 4.69807 78.3994C3.10843 78.3994 1.54262 78.3034 0.000976562 78.1295C8.71737 83.7265 19.0654 86.9899 30.1873 86.9899C66.4145 86.9899 86.2168 56.9834 86.2168 30.9603L86.1508 28.4109C90.02 25.6512 93.3673 22.1839 96.0008 18.2366ZM55.7754 32.3125H52.1124H52V41.375L54.6843 38.9082C57.3143 42.5948 61.6262 45 66.5 45C73.895 45 79.9959 39.4646 80.8876 32.3125H77.2246C76.3618 37.4564 71.8886 41.375 66.5 41.375C62.6829 41.375 59.3225 39.4066 57.3831 36.4287L61.8618 32.3125H55.7754ZM52.1124 28.6875C53.0041 21.5354 59.105 16 66.5 16C71.43 16 75.7855 18.4596 78.4045 22.2205L81 19.625V28.6875H80.8876H77.2246H75.5625H71.9375L75.7873 24.8377C73.8769 21.7112 70.4313 19.625 66.5 19.625C61.1115 19.625 56.6382 23.5436 55.7755 28.6875H52.1124Z"/>
            </svg>`

            this.twitterLogo.parentNode.appendChild(indicator)
            this.indicator = document.querySelector('.twitter-idle-autorefresh-indicator')

            let icon = this.indicator.querySelector('svg')
            icon.classList = this.twitterLogo.querySelector('svg').classList

            this.indicateStatus()
        }

        /**
         */
        indicateStatus() {
            if (this.isPaused() || ! this.options.settingLogoIndicator) {
                this.indicator.style.display = 'none'
                this.twitterLogo.style.display = 'flex'
            } else {
                this.twitterLogo.style.display = 'none'
                this.indicator.style.display = 'flex'
            }
        }

        /**
         * Retrieve the user options (or their default values).
         *
         * @param  object  options
         * @return object
         */
        getOptions(options) {
            return Object.assign(this.DefaultOptions, options)
        }

        /**
         * Output a console message with the add-on's label & version.
         *
         * @param  mixed  output
         * @return void
         */
        log(output) {
            if (! this.options.settingDebugLogs) {
                return
            }

            console.log(`[${this.Manifest.name} v${this.Manifest.version}]:`, output)
        }

        /**
         * Throw an error with the add-on's label & version.
         *
         * @param  string  message
         * @param  boolean  refresh  false
         * @return \Error
         */
        error(message, refresh = false) {
            let error = `[${this.Label} v${this.Version}]: ${message}`

            if (refresh) {
                error += ' Please refresh the page to try again.'
            }

            return new Error(error)
        }
    }

    class TweetWatcher {
        /**
         * Initialise the tweet watcher.
         *
         * @param  \TwitterIdleAutoRefresh  addon
         * @return void
         */
        constructor(addon) {
            this.addon = addon

            this.tick = 0
            this.tickrate = 0.5 // 1 tick per 500ms (= 2 ticks per second)
            this.detector = null
            this.refreshing = false
            this.userInteraction = 0
            this.scenery = { conditions: [ ], channel: false }

            let channels = [
                new ChannelHome(this.addon),
                // new ChannelProfile(this.addon),
                // new ChannelSearch(this.addon),
            ]

            this.watch(channels, [
                [
                    new ConditionFocused(this.addon),
                    new ConditionUnfocused(this.addon),
                ],
                [
                    new ConditionScrollbarTop(this.addon),
                    new ConditionScrollbarAnywhere(this.addon),
                ],
            ])
        }

        /**
         * Start the watcher.
         *
         * @param  array  channels
         * @param  array  conditions
         * @return void
         */
        watch(channels, conditions) {
            this.addon.log(`Tweet watcher running at a tick rate of 1 per ${this.tickrate * 1000}ms.`)

            document.addEventListener('mousemove', (e) => {
                if (! this.addon.options.refreshConditionMouseMovement || this.addon.isPaused()) {
                    return
                }

                let penalty = 10
                if (this.userInteraction === 0) {
                    this.addon.log(`Auto-refreshing disabled via user interaction penalty for ${penalty} ticks...`)
                }

                this.userInteraction = penalty
                this.addon.pause()
            })

            this.detector = setInterval(() => {
                this.addon.indicateStatus()

                // Exit out early of the loop if it's in the middle of a refresh
                if (this.refreshing) {
                    return
                }

                this.addon.pause()

                // Check the current conditions
                if (this.setupScenery(channels, conditions)) {
                    this.addon.resume()

                    // Handle user interaction penalties
                    if (this.addon.options.refreshConditionMouseMovement) {
                        if (this.userInteraction > 0) {
                            this.userInteraction--

                            if (this.userInteraction === 0) {
                                this.addon.log(`Auto-refreshing re-enabled via expiration of user interaction penalty.`)
                            } else {
                                return
                            }
                        }
                    }
                }

                // Exit out early if the addon hasn't been resumed by any conditions
                if (this.addon.isPaused()) {
                    return
                }

                this.tick++

                // Refresh the feed if the user specified time limit has passed
                if (this.shouldRefreshFeed()) {
                    this.refreshFeed()
                }
            }, (this.tickrate * 1000))
        }

        /**
         * Setup the add-on scenery.
         *
         * @param  array  channels
         * @param  array  conditions
         * @return boolean
         */
        setupScenery(channels, conditions) {
            let channel = this.match(channels)
            let matches = this.nestedMatch(conditions)

            if (this.sceneryChanged(channel, matches)) {
                if (channel && matches.length > 0) {
                    this.addon.log(`Auto-refreshing enabled using [${matches.join(', ')}] via ${channel}.`)
                } else {
                    this.addon.log(`Auto-refreshing disabled.`)
                }

                this.scenery.channel = channel
                this.scenery.conditions = matches
            }

            return channel && matches.length > 0
        }

        /**
         * Check if the add-on scenery has changed since the last tick.
         *
         * @param  string  channel
         * @param  array  conditions
         * @return boolean
         */
        sceneryChanged(channel, conditions) {
            let conditionsEqual = conditions.length === this.scenery.conditions.length && conditions.every((value, index) => {
                return value === this.scenery.conditions[index]
            })

            return channel !== this.scenery.channel
                || ! conditionsEqual
        }

        /**
         * Match against any of the given conditions.
         *
         * @param  array  conditions
         * @return string|boolean
         */
        match(conditions) {
            for (let i in conditions) {
                if (! (conditions[i] instanceof Condition) || ! conditions[i].match()) {
                    continue
                }

                return conditions[i].constructor.name
            }

            return false
        }

        /**
         * Match against at least one condition from each of the given groups.
         *
         * @param  array  conditions
         * @return array
         */
        nestedMatch(conditions) {
            let matches = []

            for (let i in conditions) {
                let condition = this.match(conditions[i])

                if (condition) {
                    matches.push(condition)
                }
            }

            if (matches.length !== conditions.length) {
                return []
            }

            return matches
        }

        /**
         * Check whether enough ticks has passed for us to force an update on the feeds.
         *
         * @return boolean
         */
        shouldRefreshFeed() {
            let frequency = this.addon.options.settingUpdatefrequency

            return this.tick % (frequency * (1 / this.tickrate)) === 0
        }

        /**
         * Force Twitter to update the feeds.
         *
         * @return void
         */
        refreshFeed() {
            this.refreshing = true

            document.querySelector(this.addon.RefreshSelector).click()

            this.addon.log(`Refreshing at tick ${this.tick}.`)

            const scrolling = (e) => {
                scrollTo(0, 0)
                this.refreshing = false
            }

            setTimeout(scrolling, 800)
            setTimeout(scrolling, 1000)
            setTimeout(scrolling, 1200)
        }
    }

    class Condition {
        constructor(addon) {
            if (this.constructor === Condition) {
                throw new TypeError('Abstract class "Condition" cannot be instantiated directly.'); 
            }

            this.addon = addon
        }
    }

    class ChannelHome extends Condition {
        match () {
            if (! this.addon.options.refreshChannelHome) {
                return false
            }

            let path = window.location.pathname

            return path.match(/^\/home/)
        }
    }

    class ChannelProfile extends Condition {
        match () {
            if (! this.addon.options.refreshChannelProfile) {
                return false
            }

            return document.title.match(/\(\@(.+)\)/)
        }
    }

    class ChannelSearch extends Condition {
        match () {
            if (! this.addon.options.refreshChannelSearch) {
                return false
            }

            return document.title.match(/Twitter Search/i)
        }
    }

    class ConditionFocused extends Condition {
        match () {
            let condition = this.addon.options.refreshConditionFocus.toLowerCase()

            return document.hasFocus()
                && (condition === 'focused' || condition === 'both')
        }
    }

    class ConditionUnfocused extends Condition {
        match () {
            let condition = this.addon.options.refreshConditionFocus.toLowerCase()

            return ! document.hasFocus()
                && (condition === 'unfocused' || condition === 'both')
        }
    }

    class ConditionScrollbarTop extends Condition {
        match () {
            let condition = this.addon.options.refreshConditionScrollbar.toLowerCase()
            let position = (window.pageYOffset || document.documentElement.scrollTop)

            return condition === 'top' && position === 0
        }
    }

    class ConditionScrollbarAnywhere extends Condition {
        match () {
            let condition = this.addon.options.refreshConditionScrollbar.toLowerCase()

            return condition === 'anywhere'
        }
    }

    new TwitterIdleAutoRefresh()
})()
