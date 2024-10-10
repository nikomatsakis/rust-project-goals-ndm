document.addEventListener("DOMContentLoaded", function () {
    updateProgressBars();
});

// Searches the document for `<progress>` elements.
//
// The `id` is expected to have the format `2024h2:rust-lang:rust-project-goals:123`
async function updateProgressBars() {
    let issueData = new IssueData();
    document.querySelectorAll('div.tracking-issue-progress').forEach(async progressDiv => {
        const id = progressDiv.id;
        if (!id) {
            console.error("progress element is missing an id");
            return;
        }

        try {
            const issue = await issueData.loadData(id);
            if (issue) {
                progressDiv.innerHTML = issue.progressHtml();
            }
        } catch (error) {
            console.error(`Error loading data for ${id}:`, error.message);
        }
    });
}

class IssueData {
    #dataMap = {};

    constructor() {
    }

    async loadData(id) {
        // Split the id into four parts
        const [milestone, org, repo, issue] = id.split(':');

        if (!milestone || !org || !repo || !issue) {
            throw new Error(`id ${id} does not have the expected format: dirName:org:repo:issue`);
        }

        if (!(milestone in this.#dataMap)) {
            // Construct the URL using the dirName
            const url = `/api/${milestone}.json`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.#dataMap[milestone] = data;
            } catch (error) {
                console.error(`error loading data for ${id} from ${url}:`, error.message);
                throw error;
            }
        }

        return this.#findData(milestone, org, repo, issue);
    }

    #findData(milestone, org, repo, issueString) {
        const milestoneJson = this.#dataMap[milestone];
        const repository = `${org}/${repo}`;
        let issueNumber = parseInt(issueString);

        if (milestoneJson.repository !== repository) {
            throw new Error(`expected repository ${repository} but found ${milestoneJson.repository}`);
        }

        for (let issueJson of milestoneJson.issues) {
            if (issueJson.number === issueNumber) {
                return new Issue(issueJson);
            }
        }

        return undefined;
    }
}

class Issue {
    #json;

    constructor(json) {
        this.#json = json;
    }

    progressHtml() {
        let state = this.#json.state;

        function progressElement(completed, total) {
            // If the issue is closed, then either the work is COMPLETE
            // or will never complete.
            if (state === "CLOSED") {
                if (completed === total) {
                    return `<center><img src="https://img.shields.io/badge/Completed!%20%3A%29-green" alt="Completed"/></center>`;
                } else {
                    return `<center><img src="https://img.shields.io/badge/Incomplete%20%3A%28-yellow" alt="Incomplete"/></center>`;
                }
            } else {
                return `<progress value="${completed}" max="${total}" ></progress>`;
            }
        }

        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        let o = this.#json.progress.Tracked;
        if (o) {
            return progressElement(o.completed, o.total);
        }

        o = this.#json.progress.Binary;
        if (o) {
            if (state === "OPEN") {
                return progressElement(0, 1);
            } else {
                return progressElement(1, 1);
            }
        }

        o = this.#json.progress.Error;
        let message = escapeHtml(o?.message || "Error loading status");
        return `<span title="${message}" >⚠️</span>`;
    }
}