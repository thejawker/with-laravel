import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'axios'

const defaultOptions = { takeAtLeast: 0, endPoint: null, fetchEvery: null, config: null }

function withLaravelPaginator(EnhancedComponent, options = defaultOptions) {
    return class LaravelPaginator extends Component {
        static propTypes = {
            endPoint: PropTypes.any,
            takeAtLeast: PropTypes.number,
            fetchEvery: PropTypes.number,
            config: PropTypes.object,
        }

        static defaultProps = {
            endPoint: null,
            takeAtLeast: null,
            fetchEvery: null,
        }

        constructor(props) {
            super(props)

            this.state = {
                beforeInitialLoad: true,
                loaded: false,
                loading: true,
                currentPageIndex: null,
                lastPageIndex: null,
                total: null,
                perPage: null,
                paginator: null,
                path: null,
                previousPageUrl: null,
                nextPageUrl: null,
                from: null,
                to: null,
                latestData: [],
                data: [],
                errors: null,
                otherData: null,
            }
        }

        componentWillMount() {
            this.retrieveFromEndPoint(this.getOption('endPoint'))

            if (this.getOption('fetchEvery')) {
                this.fetchIntervalId = window.setInterval(
                    this.fetchOnInterval,
                    this.getOption('fetchEvery'),
                )
            }
        }

        componentWillUnmount() {
            if (this.fetchIntervalId) {
                window.clearInterval(this.fetchIntervalId)
            }
        }

        rawGet = path => get(path, this.getOption('config'))

        getCurrentPage = () => {
            this.retrieveFromEndPoint(
                this.rawGet(this.pageFromIndex(this.state.currentPageIndex)),
                true,
            )
        }

        getOption = name => (options[name] ? options[name] : this.props[name])

        getFirstPage = (flushData = false) => {
            this.retrieveFromEndPoint(this.rawGet(this.state.path), flushData)
        }

        getLastPage = () => {
            this.retrieveFromEndPoint(this.rawGet(this.pageFromIndex(this.state.lastPageIndex)))
        }

        getNextPage = () => {
            this.retrieveFromEndPoint(this.rawGet(this.state.nextPageUrl))
        }

        getPreviousPage = () => {
            this.retrieveFromEndPoint(this.rawGet(this.state.previousPageUrl))
        }

        fetchOnInterval = () => this.getFirstPage(true)

        itemsSeen = () => {
            const itemsSeen = this.state.perPage * this.state.currentPageIndex
            return itemsSeen > this.state.total ? this.state.total : itemsSeen
        }

        pageFromIndex = id => `${this.state.path}?page=${id}`

        retrieveFromEndPoint = (endPoint, clearData = false) => {
            this.setState(() => ({ loading: true }))
            this.buildEndPoint(endPoint)
                .then((response) => {
                    const {
                        current_page,
                        last_page,
                        total,
                        per_page,
                        path,
                        prev_page_url,
                        next_page_url,
                        from,
                        to,
                        data,
                        ...other
                    } = response.data

                    this.setState(() => ({
                        beforeInitialLoad: false,
                        originalPaginator: data,
                        loading: false,
                        loaded: true,
                        currentPageIndex: current_page,
                        lastPageIndex: last_page,
                        total,
                        perPage: per_page,
                        path,
                        previousPageUrl: prev_page_url,
                        nextPageUrl: next_page_url,
                        from,
                        to,
                        latestData: data,
                        data: [...(clearData ? [] : this.state.data), ...data],
                        errors: null,
                        otherData: { ...other },
                    }))
                })
                .catch((response) => {
                    if (response.response) {
                        this.setState(() => ({ errors: response, beforeInitialLoad: false }))
                    }
                })
        }

        buildEndPoint = (endoint) => {
            if (this.getOption('takeAtLeast') !== 0) {
                return endoint.takeAtLeast(this.getOption('takeAtLeast'))
            }
            return endoint
        }

        render() {
            const { ...passThroughProps } = this.props

            const newProps = {
                paginator: {
                    isLastPage: this.state.currentPageIndex >= this.state.lastPageIndex,
                    isFirstPage: this.state.currentPageIndex === 1,
                    itemsLeft: this.state.total - this.itemsSeen(),
                    itemsSeen: this.itemsSeen(),
                    ...this.state,
                },
                getNextPage: this.getNextPage,
                getPreviousPage: this.getPreviousPage,
                getFirstPage: this.getFirstPage,
                getLastPage: this.getLastPage,
                getCurrentPage: this.getCurrentPage,
            }

            return <EnhancedComponent {...passThroughProps} {...newProps} />
        }
    }
}

export default withLaravelPaginator
