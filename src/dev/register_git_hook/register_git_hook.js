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

import chalk from 'chalk';
import { chmod, unlink, writeFile } from 'fs';
import dedent from 'dedent';
import normalizePath from 'normalize-path';
import os from 'os';
import { resolve } from 'path';
import { promisify } from 'util';
import SimpleGit from 'simple-git';
import { REPO_ROOT } from '../constants';

const simpleGit = new SimpleGit(REPO_ROOT);

const chmodAsync = promisify(chmod);
const gitRevParseAsync = promisify(simpleGit.revparse.bind(simpleGit));
const unlinkAsync = promisify(unlink);
const writeFileAsync = promisify(writeFile);

async function getPrecommitGitHookScriptPath(rootPath) {
  // Retrieves the correct location for the .git dir for
  // every git setup (including git worktree)
  const gitDirPath = (await gitRevParseAsync(['--git-dir'])).trim();

  return resolve(rootPath, gitDirPath, 'hooks/pre-commit');
}

function getKbnPrecommitGitHookScript(rootPath, nodeHome, platform) {
  return dedent(`
  #!/usr/bin/env bash
  #
  # ** THIS IS AN AUTO-GENERATED FILE **
  # ** PLEASE DO NOT CHANGE IT MANUALLY **
  #
  # GENERATED BY ${__dirname}
  # IF YOU WANNA CHANGE SOMETHING INTO THIS SCRIPT
  # PLEASE RE-RUN 'yarn kbn bootstrap' or 'node scripts/register_git_hook' IN THE ROOT
  # OF THE CURRENT PROJECT ${rootPath}

  # pre-commit script takes zero arguments: https://git-scm.com/docs/githooks#_pre_commit

  set -euo pipefail

  has_node() {
    command -v node >/dev/null 2>&1
  }

  has_nvm() {
    command -v nvm >/dev/null 2>&1
  }

  try_load_node_from_nvm_paths () {
    # If nvm is not loaded, load it
    has_node || {
      NVM_SH="${nodeHome}/.nvm/nvm.sh"

      if [ "${platform}" == "darwin" ] && [ -s "$(brew --prefix nvm)/nvm.sh" ]; then
        NVM_SH="$(brew --prefix nvm)/nvm.sh"
      fi

      export NVM_DIR=${nodeHome}/.nvm

      [ -s "$NVM_SH" ] && \. "$NVM_SH"

      # If nvm has been loaded correctly, use project .nvmrc
      has_nvm && nvm use
    }
  }

  extend_user_path() {
    if [ "${platform}" == "win32" ]; then
      export PATH="$PATH:/c/Program Files/nodejs"
    else
      export PATH="$PATH:/usr/local/bin:/usr/local"
      try_load_node_from_nvm_paths
    fi
  }

  # Extend path with common path locations for node
  # in order to make the hook working on git GUI apps
  extend_user_path

  # Check if we have node js bin in path
  has_node || {
    echo "Can't found node bin in the PATH. Please update the PATH to proceed."
    echo "If your PATH already has the node bin, maybe you are using some git GUI app."
    echo "Can't found node bin in the PATH. Please update the PATH to proceed."
    echo "If your PATH already has the node bin, maybe you are using some git GUI app not launched from the shell."
    echo "In order to proceed, you need to config the PATH used by the application that are launching your git GUI app."
    echo "If you are running macOS, you can do that using:"
    echo "'sudo launchctl config user path /usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'"

    exit 1
  }

  execute_precommit_hook() {
    node scripts/precommit_hook || return 1

    PRECOMMIT_FILE="./.git/hooks/pre-commit.local"
    if [ -x "\${PRECOMMIT_FILE}" ]; then
      echo "Executing local precommit hook found in \${PRECOMMIT_FILE}"
      "$PRECOMMIT_FILE" || return 1
    fi
  }

  execute_precommit_hook || {
    echo "Pre-commit hook failed (add --no-verify to bypass)";
    echo '  For eslint failures you can try running \`node scripts/precommit_hook --fix\`';
    exit 1;
  }

  exit 0
  `);
}

export async function registerPrecommitGitHook(log) {
  log.write(chalk.bold(`Registering Kibana pre-commit git hook...\n`));

  try {
    await writeGitHook(
      await getPrecommitGitHookScriptPath(REPO_ROOT),
      getKbnPrecommitGitHookScript(REPO_ROOT, normalizePath(os.homedir()), process.platform)
    );
  } catch (e) {
    log.write(
      `${chalk.red('fail')} Kibana pre-commit git hook was not installed as an error occur.\n`
    );
    throw e;
  }

  log.write(`${chalk.green('success')} Kibana pre-commit git hook was installed successfully.\n`);
}

async function writeGitHook(gitHookScriptPath, kbnHookScriptSource) {
  try {
    await unlinkAsync(gitHookScriptPath);
  } catch (e) {
    /* no-op */
  }

  await writeFileAsync(gitHookScriptPath, kbnHookScriptSource);
  await chmodAsync(gitHookScriptPath, 0o755);
}
