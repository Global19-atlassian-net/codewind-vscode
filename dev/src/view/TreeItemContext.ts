/*******************************************************************************
 * Copyright (c) 2019, 2020 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

// import * as vscode from "vscode";

import Project from "../codewind/project/Project";
import Connection from "../codewind/connection/Connection";
import LocalCodewindManager from "../codewind/connection/local/LocalCodewindManager";

/**
 * The functions in this file generate the TreeItems' contextIDs,
 * which are checked against the regex in package.nls.json to determine command enablement in context menus.
 */

enum TreeItemContextValues {
    BASE = "ext.cw",

    NO_PROJECTS = "noProjects",

    // Local Codewind status
    LOCAL_CW_STOPPED = "local.stopped",
    LOCAL_CW_STARTED = "local.started",

    // Connection
    CONN_BASE = "connection",
    CONN_CONNECTED = "connection-good",
    // CONN_CONNECTED must not be a substring of CONN_DISCONNECTED
    CONN_DISCONNECTED = "connection-bad",
    REMOTECONN_ENABLED = "remote.enabled",
    REMOTECONN_DISABLED = "remote.disabled",

    // CONN_WITH_REGISTRY = "registry",
    CONN_WITH_TEKTON = "tekton",

    // Project
    PROJ_BASE = "project",

    PROJ_IS_NOT_WORKSPACE_FOLDER = "isNotWorkspaceFolder",

    // (en|dis)abled are mutex
    PROJ_ENABLED = "enabled",
    PROJ_DISABLED = "disabled",

    // debuggable, started both imply enabled
    PROJ_DEBUGGABLE = "debuggable",
    PROJ_STARTED = "started",

    // auto build statuses are mutex
    PROJ_AUTOBUILD_ON = "autoBuildOn",
    PROJ_AUTOBUILD_OFF = "autoBuildOff",

    PROJ_RESTARTABLE = "restartable",

    PROJ_METRICS_DASH = "metricsDashboard",
    PROJ_PERF_DASHBOARD = "perfDashboard",

    PROJ_SHELLABLE = "shellable",

    PROJ_INJECT_METRICS_ON = "injectMetricsOn",
    PROJ_INJECT_METRICS_OFF = "injectMetricsOff",
}

namespace TreeItemContext {

    export function getLocalCWContext(localCW: LocalCodewindManager): string {
        const contextValue = localCW.isStarted ? TreeItemContextValues.LOCAL_CW_STARTED : TreeItemContextValues.LOCAL_CW_STOPPED;
        const connectionContext = localCW.localConnection ? getConnectionContextInner(localCW.localConnection) : [];
        const cv = buildContextValue([ ...connectionContext, contextValue ]);
        // Log.d("Local connection context " + cv);
        return cv;
    }

    function getConnectionContextInner(connection: Connection): string[] {
        const contextValues: TreeItemContextValues[] = [ TreeItemContextValues.CONN_BASE ];

        if (connection.isRemote) {
            if (connection.enabled) {
                contextValues.push(TreeItemContextValues.REMOTECONN_ENABLED);
            }
            else {
                contextValues.push(TreeItemContextValues.REMOTECONN_DISABLED);
            }
        }

        if (connection.isConnected) {
            if (connection.isKubeConnection) {
                contextValues.push(TreeItemContextValues.CONN_WITH_TEKTON);
            }
            contextValues.push(TreeItemContextValues.CONN_CONNECTED);
        }
        else if (connection.enabled) {
            // Enabled but not connected -> Disconnected
            contextValues.push(TreeItemContextValues.CONN_DISCONNECTED);
        }

        return contextValues;
    }

    export function getConnectionContext(connection: Connection): string {
        const cv = buildContextValue(getConnectionContextInner(connection));
        // Log.d(`The context value for ${connection} is ${cv}`);
        return cv;
    }

    export function getProjectContext(project: Project): string {
        const contextValues: TreeItemContextValues[] = [ TreeItemContextValues.PROJ_BASE ];

        if (project.state.isEnabled) {
            contextValues.push(TreeItemContextValues.PROJ_ENABLED);
            if (project.state.isStarted) {
                contextValues.push(TreeItemContextValues.PROJ_STARTED);
            }
            if (project.state.isDebuggable) {
                contextValues.push(TreeItemContextValues.PROJ_DEBUGGABLE);
            }
        }
        else {
            contextValues.push(TreeItemContextValues.PROJ_DISABLED);
        }

        if (!(project.workspaceFolder?.isExactMatch)) {
            contextValues.push(TreeItemContextValues.PROJ_IS_NOT_WORKSPACE_FOLDER);
        }

        if (project.autoBuildEnabled) {
            contextValues.push(TreeItemContextValues.PROJ_AUTOBUILD_ON);
        }
        else {
            contextValues.push(TreeItemContextValues.PROJ_AUTOBUILD_OFF);
        }

        if (project.capabilities?.supportsRestart) {
            contextValues.push(TreeItemContextValues.PROJ_RESTARTABLE);
        }

        if (project.hasMetricsDashboard) {
            contextValues.push(TreeItemContextValues.PROJ_METRICS_DASH);
        }

        if (project.perfDashboardURL) {
            contextValues.push(TreeItemContextValues.PROJ_PERF_DASHBOARD);
        }

        if (project.canInjectMetrics) {
            if (project.isInjectingMetrics) {
                contextValues.push(TreeItemContextValues.PROJ_INJECT_METRICS_ON);
            }
            else {
                contextValues.push(TreeItemContextValues.PROJ_INJECT_METRICS_OFF);
            }
        }

        if (project.canContainerShell) {
            contextValues.push(TreeItemContextValues.PROJ_SHELLABLE);
        }

        // The final result will look like eg: "ext.cw.project.enabled.autoBuildOn"
        const cv = buildContextValue(contextValues);
        // Log.d(`The context value for ${project.name} is ${cv}`);
        return cv;
    }

    function buildContextValue(subvalues: string[]): string {
        return [ TreeItemContextValues.BASE, ...subvalues].join(".");
    }
}

export default TreeItemContext;
