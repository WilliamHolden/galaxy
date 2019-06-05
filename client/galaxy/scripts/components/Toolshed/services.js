import axios from "axios";
import { getAppRoot } from "onload/loadConfig";

/** Request repositories, categories etc from toolshed server **/
export class Services {
    getCategories(toolshedUrl) {
        const paramString = `tool_shed_url=${toolshedUrl}&controller=categories`;
        const url = `${getAppRoot()}api/tool_shed/request?${paramString}`;
        return new Promise((resolve, reject) => {
            axios
                .get(url)
                .then(response => {
                    resolve(response.data);
                })
                .catch(e => {
                    reject(this._errorMessage(e));
                });
        });
    }
    getRepositories(params) {
        params["controller"] = "repositories";
        const paramString = this._getParamString(params);
        const url = `${getAppRoot()}api/tool_shed/request?${paramString}`;
        return new Promise((resolve, reject) => {
            axios
                .get(url)
                .then(response => {
                    const data = response.data;
                    const incoming = data.hits.map(x => x.repository);
                    incoming.forEach(x => {
                        x.times_downloaded = this._formatCount(x.times_downloaded);
                        x.repository_url = `${data.hostname}repository?repository_id=${x.id}`;
                    });
                    resolve(incoming);
                })
                .catch(e => {
                    reject(this._errorMessage(e));
                });
        });
    }
    getDetails(toolshedUrl, repository_id) {
        const paramString = `tool_shed_url=${toolshedUrl}&id=${repository_id}&controller=repositories&action=metadata`;
        const url = `${getAppRoot()}api/tool_shed/request?${paramString}`;
        return new Promise((resolve, reject) => {
            axios
                .get(url)
                .then(response => {
                    const data = response.data;
                    const table = Object.keys(data).map(key => data[key]);
                    table.sort((a,b) => b.numeric_revision - a.numeric_revision);
                    resolve(table);
                })
                .catch(e => {
                    reject(`${this._errorMessage(e)}, ${url}`);
                });
        });
    }
    getInstalledRepositories(repo) {
        const paramsString = `name=${repo.name}&owner=${repo.repo_owner_username}`;
        const url = `${getAppRoot()}api/tool_shed_repositories?${paramsString}`;
        return new Promise((resolve, reject) => {
            axios
                .get(url)
                .then(response => {
                    const data = response.data;
                    const result = {};
                    data.forEach(x => {
                        const d = {
                            status: x.status,
                            installed: !x.deleted && !x.uninstalled
                        }
                        result[x.changeset_revision] =
                            result[x.installed_changeset_revision] = d;
                    })
                    resolve(result);
                })
                .catch(e => {
                    reject(this._errorMessage(e));
                });
        });
    }
    installRepository(payload) {
        const url = `${getAppRoot()}api/tool_shed_repositories`;
        return new Promise((resolve, reject) => {
            axios
                .post(url, payload)
                .then(response => {
                    resolve(response.data);
                })
                .catch(e => {
                    reject(this._errorMessage(e));
                });
        });
    }
    uninstallRepository(params) {
        const paramsString = Object.keys(params).reduce(function(previous, key) {
            return `${previous}${key}=${params[key]}&`;
        }, "");
        const url = `${getAppRoot()}api/tool_shed_repositories?${paramsString}`;
        return new Promise((resolve, reject) => {
            axios
                .delete(url)
                .then(response => {
                    resolve(response.data);
                })
                .catch(e => {
                    reject(this._errorMessage(e));
                });
        });
    }
    _formatCount(value) {
        if (value > 1000) return `>${Math.floor(value / 1000)}k`;
        return value;
    }
    _errorMessage(e) {
        let message = "Request failed.";
        if (e.response) {
            message = e.response.data.err_msg || `${e.response.statusText} (${e.response.status})`;
        }
        return message;
    }
    _getParamString(params) {
        return Object.keys(params).reduce(function(previous, key) {
            return `${previous}${key}=${params[key]}&`;
        }, "");
    }
}