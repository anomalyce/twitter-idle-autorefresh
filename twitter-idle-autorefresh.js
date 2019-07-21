(function() {
    class TwitterIdleAutoRefresh {
        get Label() { return 'Twitter Idle AutoRefresh' }
        get Version() { return '1.0.0' }
        get ActivityInterval() { return 15000 }

        /**
         * Initialise the add-on
         * 
         * @return void
         */
        constructor() {
            this.enabled = true
            this.fetching = false
            this.simulator = null

            this.unreadTweetsSelector = '[data-testid="AppTabBar_Home_Link"]'
            this.twitterLogoSelector = 'h1[role="heading"] a[role="button"] > div:first-child'

            let AddOn = this
            let interval = setInterval(() => {
                AddOn.unreadTweetsElement = document.querySelector(AddOn.unreadTweetsSelector)
                AddOn.twitterLogoElement = document.querySelector(AddOn.twitterLogoSelector)
                
                if (AddOn.unreadTweetsElement && AddOn.twitterLogoElement) {
                    clearInterval(interval);
                    
                    AddOn.addStatusIndicator()
                    AddOn.output('Booted up!')
                    AddOn.watch()
                }
            }, 100);
        }

        /**
         * Display a message in the console
         *
         * @param  string  message
         * @return void
         */
        output(message) {
            console.log(`[${this.Label} v${this.Version}] ${message}`)
        }

        /**
         * Watch the DOM for changes that relates to unread tweets...
         * 
         * @return void
         */
        watch() {
            this.refreshStatusIndicator()

            let AddOn = this

            let observer = new MutationObserver((mutations, observer) => {
                AddOn.detectUnreadTweets(mutations, observer, AddOn)
            })

            observer.observe(this.unreadTweetsElement, {
                attributes: true,
                childList: false,
                subtree: false,
            })

            this.simulateUserActivity()
        }

        /**
         * Detect an unread tweet event from a mutation list
         *
         * @param  array  mutations
         * @param  object  observer
         * @param  object  AddOn
         * @return void
         */
        detectUnreadTweets(mutations, observer, AddOn) {
            if (AddOn.enabled !== true) {
                return
            }

            mutations.forEach((mutation) => {
                if (mutation.attributeName.toLowerCase() !== 'aria-label') {
                    return
                }

                let label = mutation.target.getAttribute('aria-label')
                if (! label.match(/unread tweets/i)) {
                    return
                }

                clearInterval(AddOn.simulator)

                AddOn.fetching = true

                AddOn.output('Unread tweets were detected, revealing them to you...')
                
                setTimeout(() => {
                    window.scrollTo(0, 0)

                    AddOn.fetching = false
                    AddOn.simulateUserActivity()
                }, 1000)

            })
        }

        /**
         * Add a status indicator to tell the user whether the add-on is enabled or not.
         *
         * @return void
         */
        addStatusIndicator() {
            let original = this.twitterLogoElement.querySelector('svg:not(.idle-autorefresh)')

            // Remove any previous add-on logos...
            let previous = this.twitterLogoElement.querySelectorAll('svg.idle-autorefresh')
            if (previous.length > 0) {
                return
            }

            let wrapper = document.createElement('div')
            wrapper.innerHTML = `<svg style="display: none;" width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M96.0008 18.2366C92.4675 19.8022 88.6763 20.864 84.6929 21.3381C88.7602 18.9025 91.8736 15.0392 93.3492 10.4501C89.534 12.7056 85.3227 14.3434 80.8355 15.2312C77.2422 11.398 72.1312 9.01038 66.4622 9.01038C55.5862 9.01038 46.7679 17.8287 46.7679 28.6987C46.7679 30.2403 46.9418 31.7461 47.2778 33.1859C30.913 32.364 16.4018 24.5235 6.6896 12.6096C4.99188 15.5131 4.02607 18.8963 4.02607 22.5078C4.02607 29.3406 7.50545 35.3694 12.7845 38.8967C9.55706 38.7887 6.5216 37.9009 3.86419 36.4251V36.6711C3.86419 46.2093 10.6549 54.1698 19.6592 55.9815C18.0094 56.4254 16.2698 56.6714 14.4702 56.6714C13.1985 56.6714 11.9687 56.5454 10.7629 56.3054C13.2703 64.134 20.5411 69.8269 29.1555 69.9829C22.4187 75.262 13.9243 78.3994 4.69807 78.3994C3.10843 78.3994 1.54262 78.3034 0.000976562 78.1295C8.71737 83.7265 19.0654 86.9899 30.1873 86.9899C66.4145 86.9899 86.2168 56.9834 86.2168 30.9603L86.1508 28.4109C90.02 25.6512 93.3673 22.1839 96.0008 18.2366ZM55.7754 32.3125H52.1124H52V41.375L54.6843 38.9082C57.3143 42.5948 61.6262 45 66.5 45C73.895 45 79.9959 39.4646 80.8876 32.3125H77.2246C76.3618 37.4564 71.8886 41.375 66.5 41.375C62.6829 41.375 59.3225 39.4066 57.3831 36.4287L61.8618 32.3125H55.7754ZM52.1124 28.6875C53.0041 21.5354 59.105 16 66.5 16C71.43 16 75.7855 18.4596 78.4045 22.2205L81 19.625V28.6875H80.8876H77.2246H75.5625H71.9375L75.7873 24.8377C73.8769 21.7112 70.4313 19.625 66.5 19.625C61.1115 19.625 56.6382 23.5436 55.7755 28.6875H52.1124Z"/></svg>`

            let addon = wrapper.firstChild

            // Make the logo white if on a dark theme...
            let body = document.querySelector('body')
            let head = document.head || document.getElementsByTagName('head')[0]
            let style = document.createElement('style')
            style.type = 'text/css';
            head.appendChild(style)
            
            style.appendChild(document.createTextNode('svg.idle-autorefresh { fill: #000; }'))

            if (body.style.backgroundColor !== 'rgb(255, 255, 255)') {
                style.appendChild(document.createTextNode('svg.idle-autorefresh { fill: #fff !important; }'))
            }

            // Copy all of the original logo classes over to the add-on logo...
            addon.classList.add('idle-autorefresh')
            Array.from(original.classList).forEach((name) => {
                addon.classList.add(name)
            })

            this.twitterLogoElement.appendChild(addon)
        }

        /**
         * Update the status indicator dependant on whether the page is in focus or not.
         *
         * @return void
         */
        refreshStatusIndicator() {
            let AddOn = this

            setInterval(() => {
                if (AddOn.shouldPause()) {
                    AddOn.pause()
                } else if (AddOn.shouldResume()) {
                    AddOn.resume()
                }
            }, 1000)
        }

        /**
         * Check whether the add-on should pause itself.
         *
         * @return boolean
         */
        shouldPause() {
            return this.enabled === true
                && this.fetching !== true
                && (
                    document.hasFocus()
                    || ! this.isBrowsingHomeFeed()
                    || ! this.isAtTopOfFeed()
                )
        }

        /**
         * Check whether the add-on should resume itself.
         *
         * @return boolean
         */
        shouldResume() {
            return this.enabled === false
                && ! document.hasFocus()
                && this.isBrowsingHomeFeed()
                && this.isAtTopOfFeed()
        }

        /**
         * Perform actions whenever the add-on is paused.
         *
         * @return void
         */
        pause() {
            let original = this.twitterLogoElement.querySelector('svg:not(.idle-autorefresh)')
            let addon = this.twitterLogoElement.querySelector('svg.idle-autorefresh')

            original.style.display = 'block'
            addon.style.display = 'none'

            this.enabled = false
            clearInterval(this.simulator)

            this.output('Paused!')
        }

        /**
         * Perform actions whenever the add-on is resumed from a paused state.
         *
         * @return void
         */
        resume() {
            let original = this.twitterLogoElement.querySelector('svg:not(.idle-autorefresh)')
            let addon = this.twitterLogoElement.querySelector('svg.idle-autorefresh')

            original.style.display = 'none'
            addon.style.display = 'block'

            this.enabled = true
            this.simulateUserActivity()

            this.output('Resumed!')
        }

        /**
         * Determine whether the user is browsing the home feed page.
         *
         * @return boolean
         */
        isBrowsingHomeFeed() {
            return window.location.pathname.match(/^\/home/i)
        }

        /**
         * Check if the user is at the top of the page.
         * 
         * @return boolean
         */
        isAtTopOfFeed() {
            return (window.pageYOffset || document.documentElement.scrollTop) === 0
        }

        /**
         * Simulate user activity in order to force Twitter to reveal unread tweets
         *
         * @return void
         */
        simulateUserActivity() {
            let AddOn = this

            AddOn.simulator = setInterval(() => {
                AddOn.output('Simulating user activity in order to force fetch unread tweets...')

                AddOn.unreadTweetsElement.click()
            }, AddOn.ActivityInterval)
        }
    }


    new TwitterIdleAutoRefresh()
})()
