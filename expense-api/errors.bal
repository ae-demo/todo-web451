import ballerina/http;

function toBadRequest(string message) returns http:BadRequest {
    ErrorPayload payload = {code: 400, message: message};
    return {body: payload};
}

function toUnauthorized(string message) returns http:Unauthorized {
    ErrorPayload payload = {code: 401, message: message};
    return {body: payload};
}

function toForbidden(string message) returns http:Forbidden {
    ErrorPayload payload = {code: 403, message: message};
    return {body: payload};
}

function toNotFound(string message) returns http:NotFound {
    ErrorPayload payload = {code: 404, message: message};
    return {body: payload};
}
