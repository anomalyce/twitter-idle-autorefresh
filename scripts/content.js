(() => {
    class TwitterIdleAutoRefresh {
        get Manifest() { return browser.runtime.getManifest() }
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
                refreshConditionMouseMovement: false,

                selectorFeed: 'main [data-testid=primaryColumn] section[role=region]',
                selectorRefresh: 'h1[role=heading] a[role=link] > div:first-child',
                selectorStatus: 'h1[role=heading] [href="/home"] svg',
            }
        }

        /**
         * Initialise the add-on.
         * 
         * @return void
         */
        constructor() {
            let addon = this

            this.paused = null
            this.oldState = null
            this.pauseTicks = null
            this.refreshing = false
            this.oldSceneryState = null
            this.scenery = this.resetScenery()
            
            let settings = browser.storage.sync.get(null)

            settings.then((options) => {
                addon.options = addon.getOptions(options)

                addon.twitterHasLoaded()
                    .then((data) => {
                        addon.createIndicator()

                        window.addEventListener('mousemove', (e) => { addon.monitorMouseMovement(addon, e) })
                        addon.log('Twitter has finished loading the initial feed.')

                        new TweetWatcher(addon)
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            }, (error) => {
                addon.error('Unable to fetch add-on options.', true)
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

                            if (node.matches(addon.options.selectorFeed)) {
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
         * Pause the add-on temporarily when we detect mouse movement.
         *
         * @param  \TwitterIdleAutoRefresh  addon
         * @param  object  e
         * @return void
         */
        monitorMouseMovement(addon, e) {
            if (this.options.refreshConditionMouseMovement) {
                addon.forcePauseFor(5, `Mouse movement detected, pausing for 5 ticks...`)
            }
        }

        /**
         * Reset the scenery.
         *
         * @return void
         */
        resetScenery() {
            this.oldSceneryState = this.scenery
            this.scenery = { channel: null, conditions: [] }
        }

        /**
         * Set the scenery channel.
         *
         * @param  string  channel
         * @return void
         */
        setSceneryChannel(channel) {
            this.scenery.channel = channel
        }

        /**
         * Add a scenery condition.
         *
         * @param  string  condition
         * @return void
         */
        addSceneryCondition(condition) {
            this.scenery.conditions.push(condition)
        }

        /**
         * Retrieve the current scenery channel.
         *
         * @return string
         */
        getSceneryChannel() {
            return this.scenery.channel
        }

        /**
         * Retrieve the current scenery conditions.
         *
         * @return array
         */
        getSceneryConditions() {
            return this.scenery.conditions
        }

        /**
         * Determine whether the add-on's state has changed.
         *
         * @return boolean
         */
        stateHasChanged() {
            return this.sceneryHasChanged()
                || (this.oldState !== this.paused)
        }

        /**
         * Determine whether the add-on's scenery has changed.
         *
         * @return boolean
         */
        sceneryHasChanged() {
            return (this.oldSceneryState.channel !== this.scenery.channel)
                || (this.oldSceneryState.conditions.length !== this.scenery.conditions.length)
        }

        /**
         * Set or get the refreshing status.
         *
         * @param  boolean  update  null
         * @return boolean|void
         */
        isRefreshing(update = null) {
            if (update === true) {
                this.refreshing = true
                return
            }

            if (update === false) {
                this.refreshing = false
                return
            }

            return this.refreshing
        }

        /**
         * Force pause the addon for a set amount of ticks.
         *
         * @param  integer  ticks
         * @param  string  reason  false
         * @return void
         */
        forcePauseFor(ticks, reason = false) {
            this.pauseTicks = ticks

            this.pause(reason)
        }

        /**
         * Pause the addon.
         *
         * @param  string|boolean  reason  false
         * @return void
         */
        pause(reason = false) {
            this.oldState = this.paused
            this.paused = true

            if (reason && this.stateHasChanged()) {
                this.log(reason)
            }
        }

        /**
         * Resume the addon.
         *
         * @param  string|boolean  reason  false
         * @return void
         */
        resume(reason = false) {
            this.oldState = this.paused
            this.paused = false

            if (reason && this.stateHasChanged()) {
                this.log(reason)
            }
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
         * Create the add-on's status logo.
         *
         * @return void
         */
        createIndicator() {
            this.twitterLogo = document.querySelector(this.options.selectorStatus).parentNode

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
         * Toggle between the add-on's status logo & the original Twitter logo.
         *
         * @return void
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
        get Channels() {
            return [
                new ChannelHome /*, new ChannelProfile, new ChannelSearch, */
            ]
        }

        get Conditions() {
            return [
                [ new ConditionFocused, new ConditionUnfocused ],
                [ new ConditionScrollbarTop, new ConditionScrollbarAnywhere ],
            ]
        }

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

            const channels = this.initialiseEntities(this.Channels)
            const conditions = this.initialiseEntities(this.Conditions)

            let watcher = this
            window.addEventListener('scroll', (e) => {
                let position = (window.pageYOffset || document.documentElement.scrollTop)

                if (watcher.addon.isRefreshing() && position !== 0) {
                    scrollTo(0, 0)
                    setTimeout(() => { scrollTo(0, 0) }, 200)
                    setTimeout(() => {
                        scrollTo(0, 0)
                        watcher.addon.isRefreshing(false)
                    }, 500)
                }
            })

            this.watch(channels, conditions)
        }

        /**
         * Initialise entities by properly setting them up.
         *
         * @param  array  conditions
         * @return array
         */
        initialiseEntities(conditions) {
            let result = []

            for (let i in conditions) {
                if (Array.isArray(conditions[i])) {
                    result.push(this.initialiseEntities(conditions[i]))
                    continue
                }

                let object = conditions[i]
                
                object.setup(this.addon)
                
                result.push(object)
            }

            return result
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

            this.detector = setInterval(() => {
                if (this.addon.pauseTicks > 0) {
                    this.addon.pauseTicks--

                    return this.addon.indicateStatus()
                } else if (this.addon.pauseTicks === 0) {
                    this.addon.pauseTicks = null
                    this.addon.resume('Resumed from being force paused...')
                }

                this.setupScenery(channels, conditions)

                // Exit out early if the addon hasn't been resumed by any conditions
                if (this.addon.isPaused()) {
                    return this.addon.indicateStatus()
                }

                this.tick++

                // Refresh the feed if the user specified time limit has passed
                if (this.shouldRefreshFeed()) {
                    this.refreshFeed()
                }

                this.addon.indicateStatus()
            }, (this.tickrate * 1000))
        }

        /**
         * Setup the add-on scenery.
         *
         * @param  array  channels
         * @param  array  conditions
         * @return void
         */
        setupScenery(channels, conditions) {
            if (this.addon.isRefreshing()) {
                return
            }

            this.addon.resetScenery()

            if (! this.sceneryDetectsChannel(channels)) {
                return this.addon.pause(`Invalid channel, expecting one of ${this.formatEntities(channels)}.`)
            }

            let criteria = this.sceneryMeetsCriteria(conditions)
            if (criteria.rejected.length > 0) {
                return this.addon.pause(`Unmet criteria: ${this.formatEntities(criteria.rejected)}.`)
            }

            this.addon.resume(
                `'${this.addon.getSceneryChannel()}' via ${this.formatEntities(criteria.accepted)}.`
            )
        }

        /**
         * Format entities in a more presentable manner.
         *
         * @param  array  entities
         * @return string
         */
        formatEntities(entities) {
            return entities.map((entity) => {
                if (Array.isArray(entity)) {
                    return this.formatEntities(entity)
                }

                if (entity instanceof Condition) {
                    return `'${entity.constructor.name}'`
                }

                return `'${entity}'`
            }).join(', ')
        }

        /**
         * Check if the scenery can detect a viable channel.
         *
         * @param  array  channels
         * @return boolean
         */
        sceneryDetectsChannel(channels) {
            for (let i in channels) {
                let channel = channels[i]

                if (channel.enabled() && channel.match()) {
                    this.addon.setSceneryChannel(channel.constructor.name)
                    return true
                }
            }

            return false
        }

        /**
         * Check if the scenery meets at least one enabled condition from each group.
         *
         * @param  array  conditionGroups
         * @return array
         */
        sceneryMeetsCriteria(conditionGroups) {
            let collection = {
                accepted: [],
                rejected: []
            }

            for (let group in conditionGroups) {
                let accepted = []
                let rejected = []

                for (let i in conditionGroups[group]) {
                    let condition = conditionGroups[group][i]

                    if (! condition.enabled()) {
                        continue
                    }

                    let name = condition.constructor.name

                    if (condition.match()) {
                        this.addon.addSceneryCondition(name)
                        accepted.push(name)
                    } else {
                        rejected.push(name)
                    }
                }

                collection.accepted = collection.accepted.concat(accepted)
                collection.rejected = collection.rejected.concat(rejected)
            }

            return collection
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
            this.addon.isRefreshing(true)

            document.querySelector(this.addon.options.selectorRefresh).click()

            this.addon.log(`Refreshing at tick ${this.tick}.`)

            setTimeout(() => this.addon.isRefreshing(false), 500)
        }
    }

    class Condition {
        constructor() {
            if (this.constructor === Condition) {
                throw new TypeError('Abstract class "Condition" cannot be instantiated directly.'); 
            }
        }

        setup(addon) {
            this.addon = addon
        }
    }

    class ChannelHome extends Condition {
        enabled() {
            return this.addon.options.refreshChannelHome
        }

        match() {
            let path = window.location.pathname

            return path.match(/^\/home/)
        }
    }

    class ChannelProfile extends Condition {
        enabled() {
            return this.addon.options.refreshChannelProfile
        }

        match() {
            return document.title.match(/\(\@(.+)\)/)
        }
    }

    class ChannelSearch extends Condition {
        enabled() {
            return this.addon.options.refreshChannelSearch
        }

        match() {
            return document.title.match(/Twitter Search/i)
        }
    }

    class ConditionFocused extends Condition {
        enabled() {
            let condition = this.addon.options.refreshConditionFocus.toLowerCase()

            return (condition === 'focused' || condition === 'both')
        }

        match() {
            let condition = this.addon.options.refreshConditionFocus.toLowerCase()

            return document.hasFocus() || condition === 'both'
        }
    }

    class ConditionUnfocused extends Condition {
        enabled() {
            let condition = this.addon.options.refreshConditionFocus.toLowerCase()

            return (condition === 'unfocused' || condition === 'both')
        }

        match() {
            let condition = this.addon.options.refreshConditionFocus.toLowerCase()

            return (! document.hasFocus()) || condition === 'both'
        }
    }

    class ConditionScrollbarTop extends Condition {
        enabled() {
            return this.addon.options.refreshConditionScrollbar.toLowerCase() === 'top'
        }

        match() {
            let position = (window.pageYOffset || document.documentElement.scrollTop)

            return this.addon.isRefreshing() || position === 0
        }
    }

    class ConditionScrollbarAnywhere extends Condition {
        enabled() {
            return this.addon.options.refreshConditionScrollbar.toLowerCase() === 'anywhere'
        }

        match() {
            return true
        }
    }

    new TwitterIdleAutoRefresh()
})()
