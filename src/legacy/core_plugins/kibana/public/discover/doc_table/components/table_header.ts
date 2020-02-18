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
import { wrapInI18nContext } from 'ui/i18n';
// @ts-ignore
import { uiModules } from 'ui/modules';
import { TableHeader } from './table_header/table_header';
const module = uiModules.get('app/discover');

module.directive('kbnTableHeader', function(reactDirective: any, config: any) {
  return reactDirective(
    wrapInI18nContext(TableHeader),
    [
      ['columns', { watchDepth: 'collection' }],
      ['hideTimeColumn', { watchDepth: 'value' }],
      ['indexPattern', { watchDepth: 'reference' }],
      ['isShortDots', { watchDepth: 'value' }],
      ['onChangeSortOrder', { watchDepth: 'reference' }],
      ['onMoveColumn', { watchDepth: 'reference' }],
      ['onRemoveColumn', { watchDepth: 'reference' }],
      ['onSelectAll', { watchDepth: 'reference' }],
      ['onSelectCurrentPage', { watchDepth: 'reference' }],
      ['sortOrder', { watchDepth: 'collection' }],
    ],
    { restrict: 'A' },
    {
      hideTimeColumn: config.get('doc_table:hideTimeColumn'),
      isShortDots: config.get('shortDots:enable'),
    }
  );
});
