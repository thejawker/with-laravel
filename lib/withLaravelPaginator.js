var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get as rawGet } from 'axios';

const defaultOptions = { takeAtLeast: 0, endPoint: null, fetchEvery: null };

function withLaravelPaginator(EnhancedComponent, options = defaultOptions) {
    var _class, _temp;

    return _temp = _class = class LaravelPaginator extends Component {

        constructor(props) {
            super(props);

            this.getCurrentPage = () => {
                this.retrieveFromEndPoint(rawGet(this.pageFromIndex(this.state.currentPageIndex)), true);
            };

            this.getOption = name => options[name] ? options[name] : this.props[name];

            this.getFirstPage = (flushData = false) => {
                this.retrieveFromEndPoint(rawGet(this.state.path), flushData);
            };

            this.getLastPage = () => {
                this.retrieveFromEndPoint(rawGet(this.pageFromIndex(this.state.lastPageIndex)));
            };

            this.getNextPage = () => {
                this.retrieveFromEndPoint(rawGet(this.state.nextPageUrl));
            };

            this.getPreviousPage = () => {
                this.retrieveFromEndPoint(rawGet(this.state.previousPageUrl));
            };

            this.fetchOnInterval = () => this.getFirstPage(true);

            this.itemsSeen = () => {
                const itemsSeen = this.state.perPage * this.state.currentPageIndex;
                return itemsSeen > this.state.total ? this.state.total : itemsSeen;
            };

            this.pageFromIndex = id => `${this.state.path}?page=${id}`;

            this.retrieveFromEndPoint = (endPoint, clearData = false) => {
                this.setState(() => ({ loading: true }));
                this.buildEndPoint(endPoint).then(response => {
                    const _response$data = response.data,
                          {
                        current_page,
                        last_page,
                        total,
                        per_page,
                        path,
                        prev_page_url,
                        next_page_url,
                        from,
                        to,
                        data
                    } = _response$data,
                          other = _objectWithoutProperties(_response$data, ['current_page', 'last_page', 'total', 'per_page', 'path', 'prev_page_url', 'next_page_url', 'from', 'to', 'data']);

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
                        otherData: _extends({}, other)
                    }));
                }).catch(response => {
                    if (response.response) {
                        this.setState(() => ({ errors: response, beforeInitialLoad: false }));
                    }
                });
            };

            this.buildEndPoint = endoint => {
                if (this.getOption('takeAtLeast') !== 0) {
                    return endoint.takeAtLeast(this.getOption('takeAtLeast'));
                }
                return endoint;
            };

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
                otherData: null
            };
        }

        componentWillMount() {
            this.retrieveFromEndPoint(this.getOption('endPoint'));

            if (this.getOption('fetchEvery')) {
                this.fetchIntervalId = window.setInterval(this.fetchOnInterval, this.getOption('fetchEvery'));
            }
        }

        componentWillUnmount() {
            if (this.fetchIntervalId) {
                window.clearInterval(this.fetchIntervalId);
            }
        }

        render() {
            const passThroughProps = _objectWithoutProperties(this.props, []);

            const newProps = {
                paginator: _extends({
                    isLastPage: this.state.currentPageIndex >= this.state.lastPageIndex,
                    isFirstPage: this.state.currentPageIndex === 1,
                    itemsLeft: this.state.total - this.itemsSeen(),
                    itemsSeen: this.itemsSeen()
                }, this.state),
                getNextPage: this.getNextPage,
                getPreviousPage: this.getPreviousPage,
                getFirstPage: this.getFirstPage,
                getLastPage: this.getLastPage,
                getCurrentPage: this.getCurrentPage
            };

            return React.createElement(EnhancedComponent, _extends({}, passThroughProps, newProps));
        }
    }, _class.propTypes = {
        endPoint: PropTypes.any,
        takeAtLeast: PropTypes.number,
        fetchEvery: PropTypes.number
    }, _class.defaultProps = {
        endPoint: null,
        takeAtLeast: null,
        fetchEvery: null
    }, _temp;
}

export default withLaravelPaginator;