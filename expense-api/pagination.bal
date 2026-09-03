// Shared pagination helpers for the count/next/previous/data envelope used by
// every list endpoint in openapi.yaml.

function clampLimit(int requested) returns int {
    if requested < 1 {
        return defaultPageLimit;
    }
    if requested > maxPageLimit {
        return maxPageLimit;
    }
    return requested;
}

function clampOffset(int requested) returns int {
    if requested < 0 {
        return 0;
    }
    return requested;
}

function buildPageUri(string basePath, map<string> extraParams, int pageLimit, int offset) returns string {
    string query = "limit=" + pageLimit.toString() + "&offset=" + offset.toString();
    foreach string key in extraParams.keys() {
        query = query + "&" + key + "=" + extraParams.get(key);
    }
    return basePath + "?" + query;
}

// Returns [next, previous] relative URIs, or nil when there is no such page.
function buildPaginationLinks(string basePath, map<string> extraParams, int pageLimit, int offset, int count) returns [string?, string?] {
    string? next = ();
    string? previous = ();
    if offset + pageLimit < count {
        next = buildPageUri(basePath, extraParams, pageLimit, offset + pageLimit);
    }
    if offset > 0 {
        int prevOffset = offset - pageLimit;
        if prevOffset < 0 {
            prevOffset = 0;
        }
        previous = buildPageUri(basePath, extraParams, pageLimit, prevOffset);
    }
    return [next, previous];
}
