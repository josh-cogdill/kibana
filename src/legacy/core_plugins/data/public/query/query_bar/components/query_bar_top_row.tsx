/*
 * THIS FILE HAS BEEN MODIFIED FROM THE ORIGINAL SOURCE
 * This comment only applies to modifications applied after the f421eec40b5a9f31383591e30bef86724afcd2b3 commit
 *
 * Copyright 2020 LogRhythm, Inc
 * Licensed under the LogRhythm Global End User License Agreement,
 * which can be found through this page: https://logrhythm.com/about/logrhythm-terms-and-conditions/
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { doesKueryExpressionHaveLuceneSyntaxError } from '@kbn/es-query';

import classNames from 'classnames';
import React, { useState, useEffect } from 'react';

import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiLink, EuiSuperDatePicker } from '@elastic/eui';
// @ts-ignore
import { EuiSuperUpdateButton, OnRefreshProps } from '@elastic/eui';
import { FormattedMessage, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import { Toast } from 'src/core/public';
import { TimeRange } from 'src/plugins/data/public';
import { convertQuery } from '@logrhythm/nm-web-shared/services/query_mapping';
import { useKibana } from '../../../../../../../plugins/kibana_react/public';

import { IndexPattern } from '../../../index_patterns';
import { QueryBarInput } from './query_bar_input';
import { Query, getQueryLog } from '../index';
import { TimeHistoryContract } from '../../../timefilter';
import { IDataPluginServices } from '../../../types';
import { PersistedLog } from '../../persisted_log';

import { SaveRule } from '../../../../../../../netmon/components/save_rule/save_rule';

interface Props {
  query?: Query;
  onSubmit: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onChange: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onRefresh?: (payload: { dateRange: TimeRange }) => void;
  disableAutoFocus?: boolean;
  screenTitle?: string;
  indexPatterns?: Array<IndexPattern | string>;
  intl: InjectedIntl;
  isLoading?: boolean;
  prepend?: React.ReactNode;
  showQueryInput?: boolean;
  showDatePicker?: boolean;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  isRefreshPaused?: boolean;
  refreshInterval?: number;
  showAutoRefreshOnly?: boolean;
  onRefreshChange?: (options: { isPaused: boolean; refreshInterval: number }) => void;
  customSubmitButton?: any;
  isDirty: boolean;
  timeHistory?: TimeHistoryContract;
}

function QueryBarTopRowUI(props: Props) {
  const [isDateRangeInvalid, setIsDateRangeInvalid] = useState(false);

  const kibana = useKibana<IDataPluginServices>();
  const { uiSettings, notifications, store, appName, docLinks } = kibana.services;

  const kueryQuerySyntaxLink: string = docLinks!.links.query.kueryQuerySyntax;

  const queryLanguage = props.query && props.query.language;
  let persistedLog: PersistedLog | undefined;

  const currentQueryText = props.query && props.query.query ? (props.query.query as string) : '';

  useEffect(() => {
    if (!props.query) return;
    persistedLog = getQueryLog(uiSettings!, store, appName, props.query.language);
  }, [queryLanguage]);

  useEffect(() => {
    if (!props.query || !props.query.query) return;

    let shutdown: boolean = false;
    convertQuery(props.query.query as string)
      .then(newQueryText => {
        if (!props.query || shutdown) return;
        const newQuery = {
          ...props.query,
          query: newQueryText,
        };
        const dateRange = getDateRange();
        props.onChange({
          query: newQuery,
          dateRange,
        });
        props.onSubmit({
          query: newQuery,
          dateRange,
        });
      })
      .catch(err => {
        console.warn( // eslint-disable-line
          'An error occurred trying to correct the provided query for capitalization.',
          err
        );
      });

    return () => {
      shutdown = true;
    };
  }, []);

  function onClickSubmitButton(event: React.MouseEvent<HTMLButtonElement>) {
    if (persistedLog && props.query) {
      persistedLog.add(props.query.query);
    }
    event.preventDefault();
    onSubmit({ query: props.query, dateRange: getDateRange() });
  }

  function getDateRange() {
    const defaultTimeSetting = uiSettings!.get('timepicker:timeDefaults');
    return {
      from: props.dateRangeFrom || defaultTimeSetting.from,
      to: props.dateRangeTo || defaultTimeSetting.to,
    };
  }

  function onQueryChange(query: Query) {
    props.onChange({
      query,
      dateRange: getDateRange(),
    });
  }

  function onTimeChange({
    start,
    end,
    isInvalid,
    isQuickSelection,
  }: {
    start: string;
    end: string;
    isInvalid: boolean;
    isQuickSelection: boolean;
  }) {
    setIsDateRangeInvalid(isInvalid);
    const retVal = {
      query: props.query,
      dateRange: {
        from: start,
        to: end,
      },
    };

    if (isQuickSelection) {
      props.onSubmit(retVal);
    } else {
      props.onChange(retVal);
    }
  }

  function onRefresh({ start, end }: OnRefreshProps) {
    const retVal = {
      dateRange: {
        from: start,
        to: end,
      },
    };
    if (props.onRefresh) {
      props.onRefresh(retVal);
    }
  }

  function onSubmit({ query, dateRange }: { query?: Query; dateRange: TimeRange }) {
    handleLuceneSyntaxWarning();

    if (props.timeHistory) {
      props.timeHistory.add(dateRange);
    }

    if (!query || !query.query) {
      props.onSubmit({ query, dateRange });
      return;
    }

    convertQuery(query.query as string)
      .then(newQueryText => {
        if (!query) return;
        const newQuery = {
          ...query,
          query: newQueryText,
        };
        props.onChange({
          query: newQuery,
          dateRange,
        });
        props.onSubmit({
          query: newQuery,
          dateRange,
        });
      })
      .catch(err => {
        console.warn( // eslint-disable-line
          'An error occurred trying to correct the provided query for capitalization.',
          err
        );
      });
  }

  function onInputSubmit(query: Query) {
    onSubmit({
      query,
      dateRange: getDateRange(),
    });
  }

  function renderQueryInput() {
    if (!shouldRenderQueryInput()) return;
    return (
      <EuiFlexItem>
        <QueryBarInput
          disableAutoFocus={props.disableAutoFocus}
          indexPatterns={props.indexPatterns!}
          prepend={props.prepend}
          query={props.query!}
          screenTitle={props.screenTitle}
          onChange={onQueryChange}
          onSubmit={onInputSubmit}
          persistedLog={persistedLog}
        />
      </EuiFlexItem>
    );
  }

  function shouldRenderDatePicker(): boolean {
    return Boolean(props.showDatePicker || props.showAutoRefreshOnly);
  }

  function shouldRenderQueryInput(): boolean {
    return Boolean(props.showQueryInput && props.indexPatterns && props.query && store);
  }

  function renderUpdateButton() {
    const button = props.customSubmitButton ? (
      React.cloneElement(props.customSubmitButton, { onClick: onClickSubmitButton })
    ) : (
      <EuiSuperUpdateButton
        needsUpdate={props.isDirty}
        isDisabled={isDateRangeInvalid}
        isLoading={props.isLoading}
        onClick={onClickSubmitButton}
        data-test-subj="querySubmitButton"
      />
    );

    if (!shouldRenderDatePicker()) {
      return button;
    }

    return (
      <EuiFlexGroup responsive={false} gutterSize="s">
        {renderDatePicker()}
        <EuiFlexItem grow={false}>{button}</EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  function renderDatePicker() {
    if (!shouldRenderDatePicker()) {
      return null;
    }

    let recentlyUsedRanges;
    if (props.timeHistory) {
      recentlyUsedRanges = props.timeHistory
        .get()
        .map(({ from, to }: { from: string; to: string }) => {
          return {
            start: from,
            end: to,
          };
        });
    }

    const commonlyUsedRanges = uiSettings!
      .get('timepicker:quickRanges')
      .map(({ from, to, display }: { from: string; to: string; display: string }) => {
        return {
          start: from,
          end: to,
          label: display,
        };
      });

    return (
      <EuiFlexItem className="kbnQueryBar__datePickerWrapper">
        <EuiSuperDatePicker
          start={props.dateRangeFrom}
          end={props.dateRangeTo}
          isPaused={props.isRefreshPaused}
          refreshInterval={props.refreshInterval}
          onTimeChange={onTimeChange}
          onRefresh={onRefresh}
          onRefreshChange={props.onRefreshChange}
          showUpdateButton={false}
          recentlyUsedRanges={recentlyUsedRanges}
          commonlyUsedRanges={commonlyUsedRanges}
          dateFormat={uiSettings!.get('dateFormat')}
          isAutoRefreshOnly={props.showAutoRefreshOnly}
        />
      </EuiFlexItem>
    );
  }

  function handleLuceneSyntaxWarning() {
    if (!props.query) return;
    const { intl } = props;
    const { query, language } = props.query;
    if (
      language === 'kuery' &&
      typeof query === 'string' &&
      (!store || !store.get('kibana.luceneSyntaxWarningOptOut')) &&
      doesKueryExpressionHaveLuceneSyntaxError(query)
    ) {
      const toast = notifications!.toasts.addWarning({
        title: intl.formatMessage({
          id: 'data.query.queryBar.luceneSyntaxWarningTitle',
          defaultMessage: 'Lucene syntax warning',
        }),
        text: (
          <div>
            <p>
              <FormattedMessage
                id="data.query.queryBar.luceneSyntaxWarningMessage"
                defaultMessage="It looks like you may be trying to use Lucene query syntax, although you
               have Kibana Query Language (KQL) selected. Please review the KQL docs {link}."
                values={{
                  link: (
                    <EuiLink href={kueryQuerySyntaxLink} target="_blank">
                      <FormattedMessage
                        id="data.query.queryBar.syntaxOptionsDescription.docsLinkText"
                        defaultMessage="here"
                      />
                    </EuiLink>
                  ),
                }}
              />
            </p>
            <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiButton size="s" onClick={() => onLuceneSyntaxWarningOptOut(toast)}>
                  <FormattedMessage
                    id="data.query.queryBar.luceneSyntaxWarningOptOutText"
                    defaultMessage="Don't show again"
                  />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        ),
      });
    }
  }

  function onLuceneSyntaxWarningOptOut(toast: Toast) {
    if (!store) return;
    store.set('kibana.luceneSyntaxWarningOptOut', true);
    notifications!.toasts.remove(toast);
  }

  const classes = classNames('kbnQueryBar', {
    'kbnQueryBar--withDatePicker': props.showDatePicker,
  });

  return (
    <EuiFlexGroup
      className={classes}
      responsive={!!props.showDatePicker}
      gutterSize="s"
      justifyContent="flexEnd"
    >
      {renderQueryInput()}
      <EuiFlexItem grow={false}>{renderUpdateButton()}</EuiFlexItem>
      <EuiFlexItem grow={false}>
        <SaveRule query={currentQueryText} disabledForLanguage={queryLanguage !== 'lucene'} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

QueryBarTopRowUI.defaultProps = {
  showQueryInput: true,
  showDatePicker: true,
  showAutoRefreshOnly: false,
};

export const QueryBarTopRow = injectI18n(QueryBarTopRowUI);
